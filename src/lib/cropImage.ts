/**
 * getCroppedImg — Crop an image using HTML Canvas.
 *
 * Steps:
 * 1. Create an off-screen canvas sized to the crop area.
 * 2. Draw the source image cropped to the specified pixel area.
 * 3. Convert the canvas to a Blob (JPEG, quality 0.9).
 * 4. Return the Blob and a preview URL.
 */
export function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputWidth: number,
  outputHeight: number,
): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context not available"));

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          resolve({ blob, url: URL.createObjectURL(blob) });
        },
        "image/jpeg",
        0.9,
      );
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}
