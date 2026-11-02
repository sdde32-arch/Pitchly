/**
 * Image compression utility for Pitchly.
 * Downscales and compresses images client-side before upload to Firebase Storage,
 * ensuring fast transfers on mobile networks and preventing oversized payloads.
 */

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
  maxBytes?: number;
  minQuality?: number;
}

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_MAX_BYTES = 600000; // ~600KB
const DEFAULT_MIN_QUALITY = 0.6;

/**
 * Compresses an image file to a JPEG Blob under maxBytes.
 * Uses createImageBitmap with fallback to HTMLImageElement.
 * Steps down quality (e.g., 0.82 -> 0.70 -> 0.60) until under maxBytes.
 */
export async function compressImage(
  file: File,
  opts: CompressImageOptions = {}
): Promise<Blob> {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('This photo format is not supported. Please choose a JPG or PNG.');
  }

  const maxDimension = opts.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const initialQuality = opts.quality ?? DEFAULT_QUALITY;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const minQuality = opts.minQuality ?? DEFAULT_MIN_QUALITY;

  // 1. Decode image to get natural dimensions and pixel source
  let source: ImageBitmap | HTMLImageElement;
  let naturalWidth = 0;
  let naturalHeight = 0;

  if (typeof createImageBitmap === 'function') {
    try {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        naturalWidth = bitmap.width;
        naturalHeight = bitmap.height;
        source = bitmap;
      } catch {
        const bitmap = await createImageBitmap(file);
        naturalWidth = bitmap.width;
        naturalHeight = bitmap.height;
        source = bitmap;
      }
    } catch {
      try {
        const img = await loadImageElement(file);
        naturalWidth = img.naturalWidth || img.width;
        naturalHeight = img.naturalHeight || img.height;
        source = img;
      } catch {
        throw new Error('This photo format is not supported. Please choose a JPG or PNG.');
      }
    }
  } else {
    try {
      const img = await loadImageElement(file);
      naturalWidth = img.naturalWidth || img.width;
      naturalHeight = img.naturalHeight || img.height;
      source = img;
    } catch {
      throw new Error('This photo format is not supported. Please choose a JPG or PNG.');
    }
  }

  if (naturalWidth <= 0 || naturalHeight <= 0) {
    if ('close' in source && typeof (source as ImageBitmap).close === 'function') {
      (source as ImageBitmap).close();
    }
    throw new Error('This photo format is not supported. Please choose a JPG or PNG.');
  }

  // 2. Proportional downscaling
  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // 3. Render onto HTML5 Canvas with white background for transparency conversion
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    if ('close' in source && typeof (source as ImageBitmap).close === 'function') {
      (source as ImageBitmap).close();
    }
    throw new Error('Canvas context unavailable.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  if ('close' in source && typeof (source as ImageBitmap).close === 'function') {
    (source as ImageBitmap).close();
  }

  // 4. Multi-step compression down to maxBytes
  const canvasToBlob = (q: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to encode image canvas to blob.'));
          }
        },
        'image/jpeg',
        q
      );
    });
  };

  const candidateSteps = [initialQuality, 0.7, minQuality];
  const qualitySteps = Array.from(new Set(candidateSteps.map(q => Math.max(minQuality, q)))).sort((a, b) => b - a);
  let lastBlob: Blob | null = null;

  for (const q of qualitySteps) {
    const blob = await canvasToBlob(q);
    lastBlob = blob;
    if (blob.size <= maxBytes) {
      return blob;
    }
  }

  return lastBlob || (await canvasToBlob(minQuality));
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image decode error'));
    };
    img.src = url;
  });
}
