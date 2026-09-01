import { Pixels } from './pixels.js';
import { Grid } from './grid.js';

export function GridFactory() {}

GridFactory.fromImage = function (p5, image, options = { density: undefined }) {
    image.loadPixels();
    return GridFactory.fromPixels(p5, image.pixels, image.width, image.height, options);
};

GridFactory.fromPixels = function (p5, rawPixels, width, height, { density } = { density: undefined }) {
    density = density || p5.pixelDensity();
    const pixels = new Pixels(p5, rawPixels, { width, height }, density);
    const initialize = (p5, column, row) => pixels.get({ x: column, y: row });
    return new Grid(p5, width, height, initialize);
};
