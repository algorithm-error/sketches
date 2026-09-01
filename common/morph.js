import { refinePolygon } from './path.js';
import { changePolygonStart, getCenter, getClosestPointIndex, isClockwise, movePolygonToOrigin } from './geometry.js';
import { CurveShape } from './curve-shape.js';

export function Morph(p5, from, to, step = 0.1, limit = Infinity) {
    const maxCount = Math.max(from.length, to.length);
    let fromVertices = refinePolygon(p5, from, maxCount);
    let toVertices = refinePolygon(p5, to, maxCount);
    fromVertices = isClockwise(fromVertices) ? fromVertices : fromVertices.reverse();
    toVertices = isClockwise(toVertices) ? toVertices : toVertices.reverse();
    fromVertices = movePolygonToOrigin(fromVertices);
    toVertices = movePolygonToOrigin(toVertices);
    const fromStart = fromVertices[0];
    const index = getClosestPointIndex(p5, fromStart, toVertices);
    toVertices = index !== 0 ? changePolygonStart(toVertices, index) : toVertices;

    this.fromVertices = fromVertices;
    this.toVertices = toVertices;

    const fromCenter = getCenter(fromVertices);
    const toCenter = getCenter(toVertices);

    this.fromVectors = fromVertices.map(({ x, y }) => {
        return p5.createVector(x - fromCenter.x, y - fromCenter.y);
    });
    this.toVectors = toVertices.map(({ x, y }) => {
        return p5.createVector(x - toCenter.x, y - toCenter.y);
    });
    this.steps = 0;
    this.morphVectors = [...this.fromVectors];

    this.morph = function () {
        if (this.steps > limit) {
            return this.morphVectors;
        }
        let distance = 0;

        // Look at each vertex
        for (let i = 0; i < from.length; i++) {
            const v1 = this.morphVectors[i];
            const v2 = this.toVectors[i];
            distance += P5.Vector.dist(v1, v2);
            v1.lerp(v2, step);
        }
        this.steps++;
        return this.morphVectors.map((vertex) => ({ x: vertex.x, y: vertex.y }));
    };

    this.render = function () {
        const shape = new CurveShape(p5, this.morphVectors);
        shape.render();
    };

    this.debug = function () {
        const shape = new CurveShape(p5, this.morphVectors);
        shape.debug();
    };
}
