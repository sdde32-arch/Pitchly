/**
 * Image Optimization Utility
 * Performs fast background compression and downscaling to minimize storage footprint
 * and provide instant image handling.
 */
import { storageService } from '../services/storageService';

export interface ImageOptimizationOptions {
  maxDimension?: number; // Max width or height in px (default 1024)
  quality?: number; // Compression quality 0.1 to 1.0 (default 0.72)
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface OptimizedImageResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  width: number;
  height: number;
}

/**
 * Fast client-side image downscaling and compression via HTML5 Canvas.
 * Completes in milliseconds.
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxDimension = 1024,
    quality = 0.72,
    mimeType = 'image/jpeg'
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  // Fast path: use createImageBitmap if available in modern browsers
  let width = 0;
  let height = 0;
  let sourceElement: ImageBitmap | HTMLImageElement;

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      sourceElement = bitmap;
    } catch {
      sourceElement = await loadImageElement(file);
      width = sourceElement.width;
      height = sourceElement.height;
    }
  } else {
    sourceElement = await loadImageElement(file);
    width = sourceElement.width;
    height = sourceElement.height;
  }

  if (width <= 0 || height <= 0) {
    throw new Error('Invalid image dimensions.');
  }

  // Proportional resize
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Canvas context unavailable.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium'; // 'medium' is significantly faster than 'high' with imperceptible visual difference

  // White background for JPEG
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(sourceElement, 0, 0, width, height);

  // Close bitmap memory if used
  if ('close' in sourceElement && typeof (sourceElement as ImageBitmap).close === 'function') {
    (sourceElement as ImageBitmap).close();
  }

  const dataUrl = canvas.toDataURL(mimeType, quality);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const compressedSize = blob ? blob.size : Math.round(dataUrl.length * 0.75);
        const originalSize = file.size || compressedSize;
        const savingsPercent = Math.max(
          0,
          Math.round(((originalSize - compressedSize) / (originalSize || 1)) * 100)
        );

        const newFileName = file.name ? file.name.replace(/\.[^/.]+$/, '.jpg') : `photo_${Date.now()}.jpg`;
        const compressedFile = new File([blob || new Blob([])], newFileName, {
          type: mimeType,
          lastModified: Date.now()
        });

        resolve({
          file: compressedFile,
          dataUrl,
          originalSize,
          compressedSize,
          savingsPercent,
          width,
          height,
        });
      },
      mimeType,
      quality
    );
  });
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
      reject(new Error('Failed to load image.'));
    };
    img.src = url;
  });
}

/**
 * Fast background image processor.
 * Immediately downscales and compresses.
 * Tries cloud upload with a strict 1.5s timeout; seamlessly falls back to the compressed image.
 */
export async function optimizeAndUploadPitchPhoto(
  file: File,
  userId?: string,
  options?: ImageOptimizationOptions
): Promise<string> {
  // 1. Instant compression (typically < 40-70ms)
  const optimized = await optimizeImage(file, options);

  // 2. Try Firebase Storage with 1.5s safety timeout
  if (userId && storageService?.uploadPitchPhoto) {
    try {
      const uploadPromise = storageService.uploadPitchPhoto(userId, optimized.file);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout')), 1500)
      );
      const cloudUrl = await Promise.race([uploadPromise, timeoutPromise]);
      if (cloudUrl && typeof cloudUrl === 'string') {
        return cloudUrl;
      }
    } catch {
      // Background fallback: silently use lightweight compressed data URL
    }
  }

  // 3. Return compressed lightweight image URL directly
  return optimized.dataUrl;
}
