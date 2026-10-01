import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseLocalDate(date: string | Date): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), 12, 0, 0);
    }
  }
  return new Date(date);
}

export function formatDate(date: string | Date) {
  if (!date) return 'N/A';
  const dateObj = parseLocalDate(date);
  if (isNaN(dateObj.getTime())) return 'Fecha inválida';
  
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Trims excess whitespace around signature strokes in a canvas
 * and returns high-resolution PNG data URL.
 */
export function trimCanvasToDataUrl(canvas: HTMLCanvasElement, padding = 15): string {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return '';
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];

        // Pixel is drawn if alpha is visible and not completely white
        const isNotWhite = !(r > 245 && g > 245 && b > 245);
        if (alpha > 15 && isNotWhite) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If nothing found or empty canvas
    if (maxX < minX || maxY < minY) {
      return canvas.toDataURL('image/png');
    }

    // Apply padding
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width - 1, maxX + padding);
    maxY = Math.min(canvas.height - 1, maxY + padding);

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    if (cropWidth <= 2 || cropHeight <= 2) {
      return canvas.toDataURL('image/png');
    }

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = cropWidth;
    trimmedCanvas.height = cropHeight;
    const trimmedCtx = trimmedCanvas.getContext('2d');
    if (!trimmedCtx) {
      return canvas.toDataURL('image/png');
    }

    // Draw only the cropped bounding box with transparency preserved
    trimmedCtx.drawImage(
      canvas,
      minX, minY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    return trimmedCanvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Error trimming signature canvas:', err);
    return canvas.toDataURL('image/png');
  }
}

