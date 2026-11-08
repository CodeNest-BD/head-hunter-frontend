/**
 * The brand lockup's measured constants — one source of truth for every
 * surface that draws the crosshair or the wordmark.
 *
 * These are not the semantic palette. `blue` and `navy` are theme tokens that
 * may be retuned; the logo must keep matching the artwork the client supplied,
 * so it carries its own values and drifts with nothing.
 *
 * Both geometry and colour were measured off that artwork rather than judged
 * by eye: the file was decoded pixel by pixel, a row and a column were scanned
 * through the mark for its radii, a circle was walked at the ring's radius for
 * the gap angle, and the colours are medians over solid interior regions. The
 * blue reads rgb(~13, 110, 238) with peaks at 255 in the wordmark, which is
 * `#0D6EFD` attenuated in the blue channel by JPEG — the supplied file is a
 * JPEG despite its .PNG name, and it compresses saturated blues hardest.
 */

const hex = (rgb: readonly [number, number, number]): string =>
  `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

/** Crosshair, wordmark suffix. */
export const MARK_BLUE_RGB = [13, 110, 253] as const;
export const MARK_BLUE = hex(MARK_BLUE_RGB);
/**
 * The "head-hunters" wordmark.
 *
 * Lifted a little off the artwork's literal rgb(1, 19, 76). That value is
 * correct — the file's letter interiors measure it — but it was chosen for a
 * lockup shown at around 50px, and the nav draws the wordmark at 17px, where a
 * near-black navy loses its hue and reads as plain black. This keeps the same
 * deep navy and only raises its lightness enough for the blue to survive at
 * that size; side by side with the file the difference does not register.
 */
export const MARK_NAVY_RGB = [8, 32, 100] as const;
export const MARK_NAVY = hex(MARK_NAVY_RGB);

/** Ring centreline radius on a 100-unit square. */
export const RING_R = 40;
export const RING_W = 8.5;

/**
 * The ring is broken at each axis and a bar sits in the break, clear of both
 * arc ends — the gap is what makes it read as a crosshair rather than a wheel.
 * The break measures 12 units of chord at the ring, which is 17.26° there,
 * leaving roughly 3 units of white either side of a 6-wide bar.
 */
const GAP_DEG = 17.26;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

export const RING_GAP = (GAP_DEG / 360) * CIRCUMFERENCE;
export const RING_ARC = ((90 - GAP_DEG) / 360) * CIRCUMFERENCE;
export const RING_DASH = `${RING_ARC.toFixed(2)} ${RING_GAP.toFixed(2)}`;

/**
 * The dash pattern starts its first arc due east, which puts the gap's centre
 * at 90° minus half the gap. Turning the ring by that half-gap lands all four
 * breaks on the axes, where the bars are.
 */
export const RING_ROTATE = GAP_DEG / 2;

/** Each bar: 6 wide, from r=28 out to the mark's edge at r=50. */
export const ARM = { x: 47, y: 0, width: 6, height: 22 } as const;
export const ARM_ANGLES = [0, 90, 180, 270] as const;

export const CORE_R = 18.5;
