-- Photo evidence and defect flag for complaints.
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS is_defect boolean NOT NULL DEFAULT false;

-- Evidence photos are public so authorised staff can view them in complaint records.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('complaint-photos', 'complaint-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "complaint_photo_upload" ON storage.objects;
CREATE POLICY "complaint_photo_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaint-photos');

DROP POLICY IF EXISTS "complaint_photo_update" ON storage.objects;
CREATE POLICY "complaint_photo_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'complaint-photos') WITH CHECK (bucket_id = 'complaint-photos');

DROP POLICY IF EXISTS "complaint_photo_delete" ON storage.objects;
CREATE POLICY "complaint_photo_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'complaint-photos');
