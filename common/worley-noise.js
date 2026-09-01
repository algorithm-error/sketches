/** Returns worley noise pixels grid of the given size */

export function getWorleyNoise(p5, size, maxNoise = 35, initialNumbers = undefined) {
    initialNumbers =
        initialNumbers === undefined ? Math.round((size.width * size.height) / 800) : Math.round(initialNumbers);
    const points = [];
    function worleyNoise(points, x, y) {
        const p = p5.createVector(x, y);
        let dist = Infinity;
        for (let i = 0; i < points.length; i++) {
            let d = P5.Vector.dist(points[i], p);
            if (d < dist) {
                dist = d;
            }
        }
        return dist;
    }

    for (let i = 0; i < initialNumbers; i++) {
        points.push(p5.createVector(p5.random(size.width), p5.random(size.height)));
    }

    const pixels = [];
    for (let x = 0; x < size.width; x++) {
        for (let y = 0; y < size.height; y++) {
            const nz = worleyNoise(points, x, y);
            const gray = Math.round(p5.map(nz, 0, maxNoise, 0, 255));
            const index = (x + y * size.width) * 4;
            pixels[index] = gray;
            pixels[index + 1] = gray;
            pixels[index + 2] = gray;
            pixels[index + 3] = 255;
        }
    }
    return pixels;
}
