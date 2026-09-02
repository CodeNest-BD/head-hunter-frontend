import type { Area } from "react-easy-crop";

/** The square edge, in pixels, of the exported image — plenty for any avatar. */
const OUTPUT_SIZE = 512;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("The image could not be read.")),
    );
    // The source is a same-origin object URL, so the canvas is never tainted.
    image.src = src;
  });

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Bounding box of `width`×`height` after rotating by `rotation` degrees. */
function rotatedBounds(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  const rad = toRadians(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * Render the chosen crop of an image — after applying the editor's rotation — to
 * a fixed 512×512 WebP blob ready to upload. `pixelCrop` is react-easy-crop's
 * `croppedAreaPixels`: the crop rectangle in the (rotated) image's pixel space.
 *
 * The image is first drawn rotated onto a canvas sized to its rotated bounding
 * box, then the crop rectangle is copied out and scaled to the square output —
 * one draw, no per-pixel work, so it stays fast even for large uploads.
 */
export async function cropImageToBlob(
  src: string,
  pixelCrop: Area,
  rotation: number,
): Promise<Blob> {
  const image = await loadImage(src);

  const bounds = rotatedBounds(image.width, image.height, rotation);
  const stage = document.createElement("canvas");
  stage.width = bounds.width;
  stage.height = bounds.height;
  const stageCtx = stage.getContext("2d");
  if (!stageCtx) {
    throw new Error("Could not prepare the image editor.");
  }
  // Rotate around the canvas centre, then draw the image centred on it.
  stageCtx.translate(bounds.width / 2, bounds.height / 2);
  stageCtx.rotate(toRadians(rotation));
  stageCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const output = document.createElement("canvas");
  output.width = OUTPUT_SIZE;
  output.height = OUTPUT_SIZE;
  const outputCtx = output.getContext("2d");
  if (!outputCtx) {
    throw new Error("Could not prepare the image editor.");
  }
  outputCtx.drawImage(
    stage,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return new Promise((resolve, reject) => {
    output.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not export the cropped image.")),
      "image/webp",
      0.9,
    );
  });
}
