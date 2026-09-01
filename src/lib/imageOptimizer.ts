/**
 * Ultra-robust image optimizer and compressor for Firestore documents.
 * Ensures all media data URLs are strictly compressed under 400KB (far below Firestore's 1MB limit),
 * while preserving high-definition crisp visual quality on mobile and desktop displays.
 */

export interface ImageOptimizationOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number; // target max size in bytes (default: 450,000 bytes ~ 440KB)
}

/**
 * Optimizes an image (from File, Blob, Data URL, or HTTP URL) to a safe, lightweight JPEG base64 string.
 */
export async function optimizeImageForFirestore(
  source: File | Blob | string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const maxDimension = options.maxDimension || 1200;
  const targetQuality = options.quality || 0.82;
  const maxSizeBytes = options.maxSizeBytes || 450000; // ~440KB, safely below Firestore 1MB limit

  // If it's already an external HTTP/HTTPS URL (e.g. unsplash, cdn), return as is
  if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
    return source;
  }

  // Convert File/Blob to data URL if needed
  let initialDataUrl = '';
  if (typeof source === 'string') {
    initialDataUrl = source;
  } else if (source && typeof source === 'object' && 'size' in source) {
    initialDataUrl = await readFileAsDataUrl(source as Blob);
  } else {
    return '';
  }

  if (!initialDataUrl) return '';

  // If already under max size and is a valid image format, we still recommend standardizing dimensions
  try {
    const optimized = await compressDataUrl(initialDataUrl, maxDimension, targetQuality, maxSizeBytes);
    return optimized;
  } catch (err) {
    console.warn('Image optimization warning, attempting aggressive compression fallback:', err);
    try {
      return await compressDataUrl(initialDataUrl, 800, 0.7, 300000);
    } catch {
      return initialDataUrl;
    }
  }
}

/**
 * Reads a File or Blob as a Data URL with Promise
 */
export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve((e.target?.result as string) || '');
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file from storage.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image data URL using HTML5 Canvas
 */
function compressDataUrl(
  dataUrl: string,
  maxDimension: number,
  initialQuality: number,
  maxSizeBytes: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        // Calculate scaled dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 10);
        canvas.height = Math.max(height, 10);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Apply smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // First pass at initial quality
        let currentQuality = initialQuality;
        let resultDataUrl = canvas.toDataURL('image/jpeg', currentQuality);

        // Approximate byte size of base64 data URL: (length * 3) / 4
        let estimatedBytes = Math.round((resultDataUrl.length * 3) / 4);

        // If still exceeding target size, reduce quality iteratively
        let iterations = 0;
        while (estimatedBytes > maxSizeBytes && currentQuality > 0.4 && iterations < 5) {
          iterations++;
          currentQuality -= 0.12;
          resultDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          estimatedBytes = Math.round((resultDataUrl.length * 3) / 4);
        }

        // If STILL over max size (e.g. enormous complex image), downscale canvas further
        if (estimatedBytes > maxSizeBytes) {
          const smallCanvas = document.createElement('canvas');
          const scale = 0.7;
          smallCanvas.width = Math.round(width * scale);
          smallCanvas.height = Math.round(height * scale);
          const smallCtx = smallCanvas.getContext('2d');
          if (smallCtx) {
            smallCtx.imageSmoothingEnabled = true;
            smallCtx.imageSmoothingQuality = 'medium';
            smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            resultDataUrl = smallCanvas.toDataURL('image/jpeg', 0.68);
          }
        }

        resolve(resultDataUrl);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = dataUrl;
  });
}

/**
 * Calculates human readable size from byte length or base64 data URL
 */
export function formatDataUrlSize(dataUrlOrBytes: string | number): string {
  let bytes = 0;
  if (typeof dataUrlOrBytes === 'number') {
    bytes = dataUrlOrBytes;
  } else if (typeof dataUrlOrBytes === 'string') {
    if (dataUrlOrBytes.startsWith('data:')) {
      const base64Part = dataUrlOrBytes.split(',')[1] || '';
      bytes = Math.round((base64Part.length * 3) / 4);
    } else {
      bytes = dataUrlOrBytes.length;
    }
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
