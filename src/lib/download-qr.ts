/**
 * Rasterize a rendered QR `<svg>` to a PNG with a guaranteed white quiet zone.
 *
 * `qrcode.react` renders with no margin by default, and the on-screen white
 * border lives on the wrapper element, not the SVG. Downloading the raw SVG
 * therefore produces a QR whose modules touch the image edges, which many
 * scanner apps refuse to decode. This draws the QR onto a white canvas with an
 * extra inset so the downloaded PNG always has a scannable quiet zone.
 */
export async function downloadQrSvg(
  svg: SVGSVGElement,
  filename: string,
  outputSize = 1024,
): Promise<void> {
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not render the QR image"));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);

    const padding = Math.round(outputSize * 0.08);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, padding, padding, outputSize - padding * 2, outputSize - padding * 2);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    const href = blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.download = filename;
    link.href = href;
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (blob) setTimeout(() => URL.revokeObjectURL(href), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
