import { Bezier, debugBezier } from './bezier.js';

const toSegments = (points) =>
    points.reduce((segments, { control1: control2, anchor: anchor2 }, index, points) => {
        if (index === 0) {
            return segments;
        }
        const { anchor: anchor1, control2: control1 } = points[index - 1];
        segments.push({ anchor1, anchor2, control1, control2 });
        return segments;
    }, []);

/**
 * Bezier curve which flows along a flow field.
 *
 * Without `end` the curve is a free walk: it takes `steps` steps of `step` pixels along the field
 * and stops early where it leaves the field.
 *
 * With `end` the curve runs from `start` to `end` and the field bends the interior anchors.
 * `step` is ignored, since the spacing follows from the distance and `steps`. `pull` scales the
 * field's normal displacement, from 0 for a straight line to 1 for the full bend. `falloff`
 * shapes that displacement along the curve, peaking in the middle and fading out at the ends.
 */
export function FlowBezier(
    p5,
    {
        flowField,
        attractors = [],
        start,
        end,
        steps,
        step = 10,
        handle,
        pull = 0.8,
        falloff = (position) => Math.sin(Math.PI * position),
    },
) {
    // Free walk keeps the historical default; between two points a handle longer than the
    // spacing would loop the curve, so it follows from the spacing instead
    handle = handle ?? (end === undefined ? 50 : p5.dist(start.x, start.y, end.x, end.y) / steps / 3);

    this.handle = handle;
    this.points = [];
    if (end !== undefined) {
        const segmentCount = Math.max(1, steps);
        const chord = p5.createVector(end.x - start.x, end.y - start.y);
        const chordLength = chord.mag();
        const tangent = chord.copy().normalize();
        const normal = p5.createVector(-tangent.y, tangent.x);
        const maxOffset = chordLength / 3;
        const anchors = [];

        for (let index = 0; index <= segmentCount; index++) {
            const position = index / segmentCount;
            const base = {
                x: start.x + chord.x * position,
                y: start.y + chord.y * position,
            };
            let anchor = base;

            if (index > 0 && index < segmentCount && chordLength > 0) {
                const angle = flowField?.getWeightedAverageAt(base);
                if (angle !== undefined) {
                    const field = P5.Vector.fromAngle(angle);
                    const weight = p5.constrain(pull * falloff(position), 0, 1);
                    const offset = normal.dot(field) * weight * maxOffset;
                    anchor = {
                        x: base.x + normal.x * offset,
                        y: base.y + normal.y * offset,
                    };
                }
                for (const attractor of attractors) {
                    const attraction = attractor.getForce(anchor);
                    anchor = { x: anchor.x + attraction.x, y: anchor.y + attraction.y };
                }
            }

            anchors.push(anchor);
        }

        for (let index = 0; index < anchors.length; index++) {
            const anchor = anchors[index];
            const from = anchors[index - 1] ?? anchor;
            const to = anchors[index + 1] ?? anchor;
            const angle = p5.createVector(to.x - from.x, to.y - from.y).heading();
            const handleVector1 = P5.Vector.fromAngle(angle - p5.PI, handle);
            const handleVector2 = P5.Vector.fromAngle(angle, handle);

            this.points.push({
                anchor,
                control1: { x: handleVector1.x, y: handleVector1.y },
                control2: { x: handleVector2.x, y: handleVector2.y },
                angle,
            });
        }
    } else {
        let previousVertex = start;
        for (let index = 0; index < steps; index++) {
            const anchor = previousVertex;
            const vector = p5.createVector(anchor.x, anchor.y);
            const angle = flowField?.getWeightedAverageAt(anchor);
            if (angle === undefined) {
                break;
            }
            const force = P5.Vector.fromAngle(angle, step);
            for (const attractor of attractors) {
                const attraction = attractor.getForce(anchor);
                force.add(attraction);
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
    }

    this.segments = toSegments(this.points);

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

    /** The curve as spline vertices: its anchor points, in order, without the control points */
    this.toSpline = function () {
        return Bezier.toSpline(this.segments);
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
    this.debug = function (color) {
        this.segments.map(({ anchor1, anchor2, control1, control2 }) => {
            debugBezier(
                p5,
                anchor1,
                { x: anchor1.x + control1.x, y: anchor1.y + control1.y },
                { x: anchor2.x + control2.x, y: anchor2.y + control2.y },
                anchor2,
                color,
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
        // The tangent at a vertex points from the previous vertex to the next one. The
        // first and last vertex have only one neighbour, so they use the anchor itself.
        const from = vertices[index - 1] ?? anchor;
        const to = vertices[index + 1] ?? anchor;
        const angle = p5.createVector(to.x, to.y).sub(p5.createVector(from.x, from.y)).heading();
        const handleVector1 = P5.Vector.fromAngle(angle - p5.PI, bezier.handle);
        const handleVector2 = P5.Vector.fromAngle(angle, bezier.handle);
        // Control points are relative to anchor point
        const control1 = { x: handleVector1.x, y: handleVector1.y };
        const control2 = { x: handleVector2.x, y: handleVector2.y };
        bezier.points.push({ anchor, control1, control2, angle });
    }
    bezier.segments = toSegments(bezier.points);

    return bezier;
};
