import { supabase, type Complaint } from './supabase';

export interface CreateComplaintInput {
  fit_id: string;
  qr_id: string | null;
  complaint_type: string;
  priority: Complaint['priority'];
  description: string;
  is_defect: boolean;
  photo?: File | null;
  registered_by?: string | null;
}

/**
 * Compress an image file to a lightweight data URL fallback
 */
async function fileToDataUrl(file: File, maxWidth = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image preview'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Try uploading to Supabase storage bucket, falling back to compressed base64 data URL
 */
export async function processComplaintPhoto(file: File | null, userId?: string | null): Promise<string | null> {
  if (!file) return null;

  try {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId ?? 'staff'}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('complaint-photos')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (!uploadError) {
      const { data } = supabase.storage.from('complaint-photos').getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }
  } catch (err) {
    console.warn('Supabase storage upload bypassed, using safe photo encoding:', err);
  }

  // Graceful fallback: compressed Data URL
  try {
    return await fileToDataUrl(file);
  } catch (err) {
    console.warn('Failed to encode photo:', err);
    return null;
  }
}

/**
 * Parses a complaint row from DB, decoding fallback tags if database schema lacks dedicated columns
 */
export function parseComplaintRecord(raw: any): Complaint {
  let isDefect = !!raw.is_defect;
  let photoUrl = raw.photo_url || null;
  let description = raw.description || '';

  // Extract [DEFECT] prefix if present
  if (description.startsWith('[DEFECT]')) {
    isDefect = true;
    description = description.replace(/^\[DEFECT\]\s*/, '');
  }

  // Extract [PHOTO:url] marker if present
  const photoMatch = description.match(/\n?\[PHOTO:(.*?)\]$/);
  if (photoMatch) {
    if (!photoUrl) {
      photoUrl = photoMatch[1];
    }
    description = description.replace(/\n?\[PHOTO:.*?\]$/, '');
  }

  return {
    ...raw,
    description,
    is_defect: isDefect,
    photo_url: photoUrl,
  };
}

/**
 * Creates a complaint with full compatibility across DB versions
 */
export async function createComplaintRecord(input: CreateComplaintInput): Promise<Complaint> {
  const photoUrl = await processComplaintPhoto(input.photo || null, input.registered_by);

  // 1. Try modern schema insert with dedicated columns
  const modernPayload: any = {
    fit_id: input.fit_id,
    qr_id: input.qr_id,
    complaint_type: input.complaint_type,
    priority: input.priority,
    description: input.description,
    is_defect: input.is_defect,
    photo_url: photoUrl,
    status: 'Open',
    registered_by: input.registered_by ?? null,
  };

  const { data: modernData, error: modernError } = await supabase
    .from('complaints')
    .insert(modernPayload)
    .select()
    .single();

  if (!modernError && modernData) {
    return parseComplaintRecord(modernData);
  }

  // 2. Fallback if photo_url or is_defect columns are missing in remote schema (PGRST204)
  const isMissingColumnError =
    modernError?.code === 'PGRST204' ||
    modernError?.message?.toLowerCase().includes('column') ||
    modernError?.message?.toLowerCase().includes('schema cache');

  if (isMissingColumnError) {
    let safeDescription = input.description;
    if (input.is_defect) {
      safeDescription = `[DEFECT] ${safeDescription}`;
    }
    if (photoUrl) {
      safeDescription = `${safeDescription}\n[PHOTO:${photoUrl}]`;
    }

    const legacyPayload = {
      fit_id: input.fit_id,
      qr_id: input.qr_id,
      complaint_type: input.complaint_type,
      priority: input.priority,
      description: safeDescription,
      status: 'Open',
      registered_by: input.registered_by ?? null,
    };

    const { data: legacyData, error: legacyError } = await supabase
      .from('complaints')
      .insert(legacyPayload)
      .select()
      .single();

    if (legacyError) throw legacyError;
    return parseComplaintRecord(legacyData);
  }

  throw modernError;
}

/**
 * Non-blocking notification dispatch for complaints
 */
export async function notifyNewComplaint(
  fitId: string,
  componentLabel: string,
  complaintType: string,
  priority: string
): Promise<void> {
  const title = 'New Complaint Registered';
  const message = `${complaintType} for ${componentLabel} — Priority: ${priority}`;

  try {
    // Attempt standard new_complaint type
    const { error } = await supabase.from('notifications').insert({
      type: 'new_complaint',
      title,
      message,
      fit_id: fitId,
    });

    if (error) {
      // Fallback to 'general' if DB has check constraint on notifications(type)
      await supabase.from('notifications').insert({
        type: 'general',
        title,
        message,
        fit_id: fitId,
      });
    }
  } catch (err) {
    console.warn('Failed to dispatch complaint notification (non-fatal):', err);
  }
}

