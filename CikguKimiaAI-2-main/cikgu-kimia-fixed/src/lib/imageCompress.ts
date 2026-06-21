/**
 * Utility for client-side image compression using Canvas API.
 * Compresses an image file, converting it to JPEG and scaling if it exceeds max size.
 */

export interface CompressedResult {
  base64: string; // raw base64 without prefix
  preview: string; // base64 data URL
  mimeType: string;
  originalBytes: number;
  compressedBytes: number;
}

export async function compressImageFile(file: File): Promise<CompressedResult> {
  return new Promise((resolve, reject) => {
    // If it's not an image, reject
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Max dimension constraints to keep payloads small
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D context from canvas"));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to highly-compressed JPEG (0.75 quality)
        const mimeType = "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, 0.75);

        // Strip dataurl prefix to get raw base64 content
        const parts = dataUrl.split(",");
        const base64 = parts[1] || "";

        const originalBytes = file.size;
        const compressedBytes = Math.round((base64.length * 3) / 4);

        resolve({
          base64,
          preview: dataUrl,
          mimeType,
          originalBytes,
          compressedBytes,
        });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image element"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };

    reader.readAsDataURL(file);
  });
}
