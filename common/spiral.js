import { FlowField } from './flow-field.js';
import { BOTH, IN, OUT, CUBIC_EASE, ease, QUADRATIC_EASE } from './ease.js';

export function Spiral(p5, { path, steps = 100, step = 5, radius: radii = 20, frequency = 0.63, noiseMax = 1 }) {
    const start = path.vertices[0];
    const factor = Math.round(p5.TWO_PI / frequency);
    const delta = step / factor;
    const polar = P5.Vector.fromAngle(0, Array.isArray(radii) ? radii[0] : radii);
    let center = start;
    this.vertices = [];
    this.centers = [];
    const flowField = new FlowField(p5, {
        width: Math.min(steps, 1000) * factor,
        height: 1,
        initialize: (p5, column, row) => p5.noise(column, row),
    });

    this.addVertex = (vertextIndex, stepIndex) => {
        const angle = vertextIndex * frequency;
        const xOffset = p5.map(p5.cos(angle), -1, 1, 0, noiseMax);
        const yOffset = p5.map(p5.sin(angle), -1, 1, 0, noiseMax);
        const radiusNoise = p5.noise(xOffset, yOffset);
        const deltaNoise = flowField.get({ column: vertextIndex, row: 0 });

        polar.setHeading(angle);
        if (Array.isArray(radii)) {
            const stepsPerSegment = steps / (radii.length - 1);
            const radius1 = radii[Math.floor(stepIndex / stepsPerSegment)];
            const radius2 = radii[Math.floor(stepIndex / stepsPerSegment) + 1];
            const radius = ease(
                stepIndex % stepsPerSegment,
                0,
                stepsPerSegment,
                radius1,
                radius2,
                QUADRATIC_EASE,
                BOTH,
            );
            polar.setMag(p5.map(radiusNoise, 0, 1, radius, radius * 2));
        } else {
            polar.setMag(p5.map(radiusNoise, 0, 1, radii, radii * 2));
        }
        const direction = P5.Vector.fromAngle(path.getAngleAt(center), delta * deltaNoise);
        this.vertices.push({ x: center.x + polar.x, y: center.y + polar.y });
        this.centers.push(center);
        center = { x: center.x + direction.x, y: center.y + direction.y };
    };

    this.debug = () => {
        p5.push();
        p5.strokeWeight(3);
        p5.stroke(255, 0, 0, 255);
        this.centers.forEach(({ x, y }) => {
            p5.point(x, y);
        });
        p5.pop();
    };

    this.render = () => {
        p5.beginShape();
        this.vertices.forEach(({ x, y }, index, curve) => {
            if (index === 0 || index === curve.length - 1) {
                p5.curveVertex(x, y);
            }
            p5.curveVertex(x, y);
        });
        p5.endShape();
    };

    if (steps === Infinity) {
        let index = 0;
        while (index < 4000 /* && p5.createVector(end.x - center.x, end.y - center.y).heading()*/) {
            this.addVertex(index);
            index++;
        }
    } else {
        for (let vertexIndex = 0; vertexIndex < steps * factor; vertexIndex++) {
            const stepIndex = vertexIndex / factor;
            this.addVertex(vertexIndex, stepIndex);
        }
    }
}
