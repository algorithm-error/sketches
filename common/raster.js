export function getAverage(pixels) {
    let total = { r: 0, g: 0, b: 0 };
    const length = pixels.width * pixels.height;
    pixels.forEach((value) => {
        const { r, g, b } = value;
        total.r += r;
        total.g += g;
        total.b += b;
    });
    return { r: Math.round(total.r / length), g: Math.round(total.g / length), b: Math.round(total.b / length), a: 1 };
}
