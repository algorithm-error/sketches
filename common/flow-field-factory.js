import { Pixels } from './pixels.js';
import { FlowField } from './flow-field.js';
import { Grid } from './grid.js';
import { getFingerprint, getRadial, getVortex } from '../flow-field/flow-presets.js';

export function FlowFieldFactory() {}

FlowFieldFactory.fromImage = function (
    p5,
    image,
    { width, height, cellSize = 1, density = 1, initialize },
    invert = false,
) {
    image.loadPixels();
    const whole = new Pixels(p5, image.pixels, { width: image.width, height: image.height }, density);
    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    let min = 255,
        max = 0;
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const { r, g, b } = whole.get({ x, y });
            const brightness = (r + g + b) / 3;
            if (brightness < min) min = brightness;
            if (brightness > max) max = brightness;
        }
    }
    const range = { min, max };
    const initializeCell = (p5, column, row) => {
        const imgX = Math.min(Math.floor((column * image.width) / columns), image.width - 1);
        const imgY = Math.min(Math.floor((row * image.height) / rows), image.height - 1);
        const { r, g, b } = whole.get({ x: imgX, y: imgY });
        const brightness = (r + g + b) / 3;
        const value = invert
            ? p5.map(brightness, min, max, Math.PI, -Math.PI)
            : p5.map(brightness, min, max, -Math.PI, Math.PI);
        return initialize ? initialize(p5, column, row, value, range) : value;
    };
    return new FlowField(p5, { width: columns, height: rows, cellSize, initialize: initializeCell });
};

FlowFieldFactory.fromPixels = function (
    p5,
    pixels,
    imageSize,
    slice,
    { cellSize, density } = { cellSize: 1, density },
    invert = false,
) {
    density = density || p5.pixelDensity();
    const whole = new Pixels(p5, pixels, imageSize, density);
    const { get: getPixel } =
        slice?.width === undefined && slice?.height === undefined ? whole : Pixels.slice(p5, whole, slice);
    const initialize = (p5, column, row) => {
        const { r, g, b } = getPixel({ x: column, y: row });
        if (invert) {
            return p5.map((r + g + b) / 3, 0, 255, 1, -1);
        } else {
            return p5.map((r + g + b) / 3, 0, 255, -1, 1);
        }
    };
    const width = slice?.width ?? imageSize.width;
    const height = slice?.height ?? imageSize.height;
    return new FlowField(p5, { width, height, cellSize, initialize });
};

FlowFieldFactory.fromValues = function (p5, { values, cellSize }) {
    const width = values[0].length;
    const height = values.length;
    return new FlowField(p5, { width, height, cellSize, initialize: (p5, column, row) => values[row][column] });
};

FlowFieldFactory.fromFields = function (p5, fields = []) {
    const values = Grid.join(
        p5,
        fields.map((field) => field.values),
    );
    const first = fields[0];
    return FlowFieldFactory.fromValues(p5, { values, cellSize: first.cellSize });
};

/** Returns flow field preset: vortex, fingerprint or radial */
FlowFieldFactory.getPreset = function (p5, preset, { columns, rows, cellSize }) {
    switch (preset) {
        case 'vortex': {
            const values = getVortex(columns, rows, cellSize);
            return FlowFieldFactory.fromValues(p5, { values, cellSize });
        }
        case 'radial': {
            const values = getRadial(columns, rows, cellSize);
            return FlowFieldFactory.fromValues(p5, { values, cellSize });
        }
        case 'fingerprint': {
            const values = getFingerprint(columns, rows, cellSize);
            return FlowFieldFactory.fromValues(p5, { values, cellSize });
        }
        default:
            throw 'Unknown preset';
    }
};
