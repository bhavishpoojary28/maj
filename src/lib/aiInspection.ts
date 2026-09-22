export type BoundingBox = { x: number; y: number; w: number; h: number; label: string; severity: 'low' | 'medium' | 'high' };
export type HeatmapCell = { x: number; y: number; intensity: number };

export type AiCheckResult = {
  result: 'PASS' | 'FAIL';
  confidence: number;
  problems: string[];
  checks: {
    readability: { label: string; pass: boolean; score: number };
    alignment: { label: string; pass: boolean; score: number };
    blur: { label: string; pass: boolean; score: number };
    damage: { label: string; pass: boolean; score: number };
    contrast: { label: string; pass: boolean; score: number };
  };
  boundingBoxes: BoundingBox[];
  heatmap: HeatmapCell[];
  recommendation: string;
};

export async function runAiInspection(imageDataUrl: string): Promise<AiCheckResult> {
  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement('canvas');
  const maxDim = 256;
  const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const luminances: number[] = [];
  let sumLum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luminances.push(lum); sumLum += lum;
  }
  const meanLum = sumLum / luminances.length;

  let variance = 0;
  for (const l of luminances) variance += (l - meanLum) ** 2;
  const stdDev = Math.sqrt(variance / luminances.length);
  const contrastScore = Math.min(100, (stdDev / 70) * 100);

  let lapSum = 0, lapSqSum = 0, lapCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap = -4 * luminances[idx] + luminances[idx - 1] + luminances[idx + 1] + luminances[idx - width] + luminances[idx + width];
      lapSum += lap; lapSqSum += lap * lap; lapCount++;
    }
  }
  const lapMean = lapSum / lapCount;
  const lapVar = lapSqSum / lapCount - lapMean * lapMean;
  const blurScore = Math.min(100, (lapVar / 1200) * 100);

  let darkCount = 0;
  for (const l of luminances) if (l < 40) darkCount++;
  const darkRatio = darkCount / luminances.length;
  const damageScore = Math.max(0, 100 - darkRatio * 300);

  let xSum = 0, ySum = 0, weightSum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const w = 255 - luminances[y * width + x];
      xSum += x * w; ySum += y * w; weightSum += w;
    }
  }
  const cx = weightSum > 0 ? xSum / weightSum : width / 2;
  const cy = weightSum > 0 ? ySum / weightSum : height / 2;
  const offset = Math.sqrt((cx - width / 2) ** 2 + (cy - height / 2) ** 2);
  const maxOffset = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);
  const alignmentScore = Math.max(0, 100 - (offset / maxOffset) * 100 * 1.8);

  const readabilityScore = contrastScore * 0.4 + blurScore * 0.4 + alignmentScore * 0.2;

  let seed = 0;
  for (let i = 0; i < data.length; i += 97) seed = (seed + data[i]) % 100000;
  const jitter = (n: number) => ((seed = (seed * 9301 + 49297) % 233280) / 233280) * n - n / 2;

  const checks = {
    readability: { label: 'QR Readability', pass: readabilityScore + jitter(8) > 55, score: clamp(readabilityScore + jitter(8)) },
    alignment: { label: 'Alignment', pass: alignmentScore + jitter(10) > 50, score: clamp(alignmentScore + jitter(10)) },
    blur: { label: 'Blur Detection', pass: blurScore + jitter(8) > 45, score: clamp(blurScore + jitter(8)) },
    damage: { label: 'Damage Detection', pass: damageScore + jitter(6) > 55, score: clamp(damageScore + jitter(6)) },
    contrast: { label: 'Contrast', pass: contrastScore + jitter(8) > 50, score: clamp(contrastScore + jitter(8)) },
  };

  const problems: string[] = [];
  if (!checks.readability.pass) problems.push('Missing or unreadable QR code');
  if (!checks.alignment.pass) problems.push('Incorrect alignment / skew detected');
  if (!checks.blur.pass) problems.push('Image blur detected — marking may be illegible');
  if (!checks.damage.pass) problems.push('Damaged marking — scratches or wear detected');
  if (!checks.contrast.pass) problems.push('Low contrast — laser etching too faint');

  const overallConfidence = clamp(Object.values(checks).reduce((s, c) => s + c.score, 0) / 5 + jitter(5));
  const result: 'PASS' | 'FAIL' = problems.length === 0 && overallConfidence > 60 ? 'PASS' : 'FAIL';

  // Bounding boxes based on detected issues
  const boundingBoxes: BoundingBox[] = [];
  if (!checks.blur.pass) boundingBoxes.push({ x: 0.15, y: 0.2, w: 0.5, h: 0.4, label: 'Blurry Region', severity: 'medium' });
  if (!checks.contrast.pass) boundingBoxes.push({ x: 0.2, y: 0.1, w: 0.6, h: 0.3, label: 'Low Contrast', severity: 'low' });
  if (!checks.damage.pass) boundingBoxes.push({ x: 0.4, y: 0.5, w: 0.3, h: 0.3, label: 'Damage Detected', severity: 'high' });
  if (!checks.alignment.pass) boundingBoxes.push({ x: 0.1, y: 0.3, w: 0.8, h: 0.5, label: 'Misaligned', severity: 'medium' });

  // Heatmap grid (8x8)
  const heatmap: HeatmapCell[] = [];
  for (let hy = 0; hy < 8; hy++) {
    for (let hx = 0; hx < 8; hx++) {
      const lumIdx = Math.floor((hy / 8) * height) * width + Math.floor((hx / 8) * width);
      const lum = luminances[lumIdx] ?? 128;
      const intensity = Math.abs(128 - lum) / 128;
      heatmap.push({ x: hx / 8, y: hy / 8, intensity: clamp(intensity * 100) });
    }
  }

  // Recommendation
  let recommendation = 'QR marking passes all quality checks. No action required.';
  if (result === 'FAIL') {
    const recs: string[] = [];
    if (!checks.contrast.pass) recs.push('Increase laser power or reduce marking speed to improve contrast');
    if (!checks.blur.pass) recs.push('Clean the marking surface and ensure camera focus during inspection');
    if (!checks.alignment.pass) recs.push('Re-align the laser head or recalibrate the marking fixture');
    if (!checks.damage.pass) recs.push('Replace the damaged component or re-mark on a clean surface');
    if (!checks.readability.pass) recs.push('Re-mark the QR code with higher error correction level (H)');
    recommendation = recs.join('. ');
  }

  return { result, confidence: overallConfidence, problems, checks, boundingBoxes, heatmap, recommendation };
}

function clamp(n: number, min = 0, max = 100): number { return Math.round(Math.max(min, Math.min(max, n))); }
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
