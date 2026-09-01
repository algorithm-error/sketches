import { CurveShape } from './curve-shape.js';

function getCircularOffset(p5, { step, index, phase = 0, max }) {
    const angle = step * index;
    const x = p5.map(p5.cos(angle + phase), -1, 1, 0, max);
    const y = p5.map(p5.sin(angle + phase), -1, 1, 0, max);
    return { x, y };
}

export function PerlinLoop(
    p5,
    {
        x = 0,
        y = 0,
        minRadius = 100,
        maxRadius = 200,
        maxNoise = 5,
        phase = 0,
        steps = 13,
        getOffset = getCircularOffset,
    },
) {
    const step = (p5.PI * 2) / steps;
    const vertices = new Array(steps).fill().map((element, index) => {
        const angle = step * index;
        const { x: xOffset, y: yOffset } = getOffset(p5, { step, index, phase, max: maxNoise });
        const radius = p5.map(p5.noise(xOffset, yOffset), 0, 1, minRadius, maxRadius);
        return { x: x + p5.cos(angle) * radius, y: y + p5.sin(angle) * radius };
    });
    const shape = new CurveShape(p5, vertices);
    this.vertices = shape.vertices;

    this.render = function () {
        shape.render();
    };

    this.debug = function () {
        shape.debug();
    };
}
