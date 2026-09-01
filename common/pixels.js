/**
 * Simplifies work with p5 pixels array.
 * Width and height are required, because pixels is a single-dimensional array
 * In a single-dimensional array there is no way to tell when one line ends and the other begins.
 */
function Pixels(p5, pixels = undefined, { width, height }, density = 1) {
    pixels = pixels || p5.pixels;
    density = density || p5.pixelDensity();
    const levels = 4; // rgba

    const get = ({ x, y }) => {
        const index = (x + y * width) * levels * Math.pow(density, 2);
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const alpha = pixels[index + 3];
        return { r, g, b, alpha };
    };

    return {
        width,
        height,
        reset(initialize = ({ x, y }) => ({ r: 0, g: 0, b: 0, alpha: 255 })) {
            for (let y = 0; y < height * density; y++) {
                for (let x = 0; x < width * density; x++) {
                    const index = (x + y * width * density) * 4;
                    const { r, g, b, alpha } = initialize({ x, y });
                    pixels[index] = r;
                    pixels[index + 1] = g;
                    pixels[index + 2] = b;
                    pixels[index + 3] = alpha;
                    if (density === 2) {
                        pixels[index + 4] = r;
                        pixels[index + 5] = g;
                        pixels[index + 6] = b;
                        pixels[index + 7] = alpha;

                        pixels[index + 8] = r;
                        pixels[index + 9] = g;
                        pixels[index + 10] = b;
                        pixels[index + 11] = alpha;

                        pixels[index + 12] = r;
                        pixels[index + 13] = g;
                        pixels[index + 14] = b;
                        pixels[index + 15] = alpha;
                    }
                }
            }
        },
        get,
        set({ x, y }, { r, g, b, alpha } = { r: 0, g: 0, b: 0, alpha: 255 }) {
            const index = (x + y * width * density) * 4;
            pixels[index] = r;
            pixels[index + 1] = g;
            pixels[index + 2] = b;
            pixels[index + 3] = alpha;
            if (density === 2) {
                pixels[index + 4] = r;
                pixels[index + 5] = g;
                pixels[index + 6] = b;
                pixels[index + 7] = alpha;

                pixels[index + 8] = r;
                pixels[index + 9] = g;
                pixels[index + 10] = b;
                pixels[index + 11] = alpha;

                pixels[index + 12] = r;
                pixels[index + 13] = g;
                pixels[index + 14] = b;
                pixels[index + 15] = alpha;
            }
        },
        forEach(predicate = (value, x, y) => {}) {
            for (let y = 0; y < height * density; y++) {
                for (let x = 0; x < width * density; x++) {
                    const value = get({ x, y });
                    predicate(value, x, y);
                }
            }
        },
        pixels,
        equals(pixels) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const { r: r1, g: g1, b: b1, alpha: alpha1 } = get({ x, y });
                    const { r: r2, g: g2, b: b2, alpha: alpha2 } = pixels.get({ x, y });
                    if (r1 !== r2 || g1 !== g2 || b1 !== b2 || alpha1 !== alpha2) {
                        return false;
                    }
                }
            }
            return true;
        },
    };
}

/** Returns a slice of a whole, pixels copied. */
Pixels.slice = (p5, whole, { left = 0, top = 0, width, height } = {}, wrap = false, density) => {
    if (left % 1 !== 0 || top % 1 !== 0 || width % 1 !== 0 || height % 1 !== 0) {
        throw 'Pixels.slice box should be an integer';
    } else if (left > whole.width || top > whole.height) {
        throw 'Left or top is overflowing when slicing pixels';
    }
    if (!wrap) {
        width = Math.min(width, whole.width - left);
        height = Math.min(height, whole.height - top);
    }
    const slice = new Pixels(p5, [], { width, height }, density);
    slice.reset(({ x, y }) => {
        const coordinates = { x: left + x, y: top + y };
        if (wrap) {
            coordinates.x = coordinates.x % whole.width;
            coordinates.y = coordinates.y % whole.height;
        }
        return whole.get(coordinates);
    });
    return slice;
};

export { Pixels };
