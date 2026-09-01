import { debugBezier } from './bezier.js';

/** Bezier curve which flows along a flow field */
export function FlowBezier(p5, { flowField, attractors = [], start, steps, step = 10, handle = 50 }) {
    let previousVertex = start;
    this.points = [];
    for (let index = 0; index < steps; index++) {
        const anchor = previousVertex;
        const vector = p5.createVector(anchor.x, anchor.y);
        const angle = flowField.getWeightedAverageAt(anchor);
        if (angle === undefined) {
            break;
        }
        const force = P5.Vector.fromAngle(angle, step);
        if (attractors.length > 0) {
            for (const attractor of attractors) {
                const attraction = attractor.getForce(anchor);
                force.add(attraction);
            }
        }
        vector.add(force);

        previousVertex = { x: vector.x, y: vector.y };
        const handleVector1 = P5.Vector.fromAngle(force.heading() - p5.PI, handle);
        const handleVector2 = P5.Vector.fromAngle(force.heading(), handle);
        const control1 = { x: handleVector1.x, y: handleVector1.y };
        const control2 = { x: handleVector2.x, y: handleVector2.y };

        // Control points are relative to anchor point
        this.points.push({ anchor, control1, control2, angle: force.heading() });
    }

    this.segments = this.points.reduce((segments, { control1: control2, anchor: anchor2 }, index, points) => {
        if (index === 0) {
            return segments;
        }
        const { anchor: anchor1, control2: control1 } = points[index - 1];
        segments.push({ anchor1, anchor2, control1, control2 });
        return segments;
    }, []);

    this.smooth = function () {
        for (let index = 0; index < this.points.length; index++) {
            if (index === 0 || index === this.points.length - 1) {
                continue;
            }
            const vertex = this.points[index];
            const previous = this.points[index - 1];
            const next = this.points[index + 1];
            const correction = (next.angle - previous.angle) / 4;

            const { control1, control2, angle } = vertex;
            const handleVector1 = P5.Vector.fromAngle(angle - p5.PI - correction, handle);
            const handleVector2 = P5.Vector.fromAngle(angle - correction, handle);
            control1.x = handleVector1.x;
            control1.y = handleVector1.y;
            control2.x = handleVector2.x;
            control2.y = handleVector2.y;
        }
    };

    this.reflow = function () {
        this.points = this.points.reverse().map((point) => {
            const { anchor, control1, control2 } = point;
            return { anchor, control1: control2, control2: control1 };
        });
        this.segments = this.segments.reverse().map((segment) => {
            const { anchor1, anchor2, control1, control2 } = segment;
            return { anchor1: anchor2, control1: control2, anchor2: anchor1, control2: control1 };
        });
    };

    this.getStart = function () {
        return this.points[0].anchor;
    };
    this.getEnd = function () {
        return this.points.slice(-1)[0].anchor;
    };
    this.render = function () {
        this.segments.forEach(({ anchor1, anchor2, control1, control2 }, index, vertices) => {
            // Control points are relative to anchor point
            p5.bezier(
                anchor1.x,
                anchor1.y,
                anchor1.x + control1.x,
                anchor1.y + control1.y,
                anchor2.x + control2.x,
                anchor2.y + control2.y,
                anchor2.x,
                anchor2.y,
            );
        });
    };
    this.debug = function () {
        this.segments.map(({ anchor1, anchor2, control1, control2 }) => {
            debugBezier(
                p5,
                anchor1,
                { x: anchor1.x + control1.x, y: anchor1.y + control1.y },
                { x: anchor2.x + control2.x, y: anchor2.y + control2.y },
                anchor2,
            );
        });
    };
}

FlowBezier.fromVertices = (p5, { vertices = [], handle = 50 }) => {
    if (vertices.length === 0) {
        throw 'At least one vertex required for a bezier curve';
    }
    const bezier = new FlowBezier(p5, { flowField: undefined, start: vertices[0], steps: 0, handle });
    if (vertices.length === 1) {
        return bezier;
    }
    for (let index = 0; index < vertices.length; index++) {
        const anchor = vertices[index];
        const nextVertex = vertices[index + 1];
        if (!nextVertex) {
            continue;
        }
        const vector = p5.createVector(anchor.x, anchor.y);
        const nextVector = p5.createVector(nextVertex.x, nextVertex.y);
        if (nextVector) {
            const angle = nextVector.sub(vector).heading();
            const handleVector1 = P5.Vector.fromAngle(angle - p5.PI, bezier.handle);
            const handleVector2 = P5.Vector.fromAngle(angle, bezier.handle);
            const controlVector1 = p5.createVector(anchor.x, anchor.y).add(handleVector1);
            const controlVector2 = p5.createVector(anchor.x, anchor.y).add(handleVector2);
            const control1 = { x: controlVector1.x, y: controlVector1.y };
            const control2 = { x: controlVector2.x, y: controlVector2.y };
            bezier.points.push({ anchor, control1, control2 });
        } else {
            // FIXME Determine the anchor of the last control point
            bezier.points.push({ anchor, control1: anchor, control2: anchor });
        }
    }
    bezier.segments = bezier.points.reduce((segments, { control1: control2, anchor: anchor2 }, index, points) => {
        if (index === 0) {
            return segments;
        }
        const { anchor: anchor1, control2: control1 } = points[index - 1];
        segments.push({ anchor1, anchor2, control1, control2 });
        return segments;
    }, []);

    return bezier;
};
