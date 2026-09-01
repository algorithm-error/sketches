/** Creates a bezier segment. Control points are relative to each other. */
export function BezierSegment(p5, anchor1, control1, control2, anchor2) {
    this.anchor1 = anchor1;
    this.anchor2 = anchor2;
    this.control1 = control1;
    this.control2 = control2;
    this.render = function () {
        // Control points are relative to anchor point
        p5.bezier(
            this.anchor1.x,
            this.anchor1.y,
            this.anchor1.x + this.control1.x,
            this.anchor1.y + this.control1.y,
            this.anchor2.x + this.control2.x,
            this.anchor2.y + this.control2.y,
            this.anchor2.x,
            this.anchor2.y,
        );
    };
    this.debug = function (color = undefined) {
        debugBezier(
            p5,
            this.anchor1,
            { x: this.anchor1.x + this.control1.x, y: this.anchor1.y + this.control1.y },
            { x: this.anchor2.x + this.control2.x, y: this.anchor2.y + this.control2.y },
            this.anchor2,
            color,
        );
    };
    /** Relative control point mirrored through anchor1 — use for the previous segment's control2 to get a smooth join */
    this.oppositeControl1 = function () {
        return { x: -this.control1.x, y: -this.control1.y };
    };
    /** Relative control point mirrored through anchor2 — use for the next segment's control1 to get a smooth join */
    this.oppositeControl2 = function () {
        return { x: -this.control2.x, y: -this.control2.y };
    };
}

/** Creates a bezier from a segment where control points are relative (default) */
BezierSegment.fromRelative = function (p5, anchor1, control1, control2, anchor2) {
    return new BezierSegment(p5, anchor1, control1, control2, anchor2);
};

/** Creates a bezier where control points are polar coordinates {angle, radius} relative to their anchors */
BezierSegment.fromRelativePolar = function (p5, anchor1, control1, control2, anchor2) {
    const toCartesian = ({ angle, radius }) => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
    return new BezierSegment(p5, anchor1, toCartesian(control1), toCartesian(control2), anchor2);
};

/** Creates a bezier where control points are p5 vectors relative to their anchors */
BezierSegment.fromRelativeVector = function (p5, anchor1, control1, control2, anchor2) {
    return new BezierSegment(p5, anchor1, { x: control1.x, y: control1.y }, { x: control2.x, y: control2.y }, anchor2);
};

/** Creates a bezier from a segment where control points are absolute */
BezierSegment.fromAbsolute = function (p5, anchor1, control1, control2, anchor2) {
    return new BezierSegment(
        p5,
        anchor1,
        { x: control1.x - anchor1.x, y: control1.y - anchor1.y },
        { x: control2.x - anchor2.x, y: control2.y - anchor2.y },
        anchor2,
    );
};

BezierSegment.fromSpline = function (p5, points) {
    if (points.length < 2) throw 'Two vertices are required for a bezier segment';

    // Add duplicate points at start and end for catmull-rom
    const extendedPoints = [points[0], ...points, points[points.length - 1]];

    const startPoint = points[0];
    const endPoint = points[points.length - 1];

    // Calculate start tangent (from first segment)
    const startTangent = {
        x: (extendedPoints[2].x - extendedPoints[0].x) / 2,
        y: (extendedPoints[2].y - extendedPoints[0].y) / 2,
    };

    // Calculate end tangent (from last segment)
    const len = extendedPoints.length;
    const endTangent = {
        x: (extendedPoints[len - 1].x - extendedPoints[len - 3].x) / 2,
        y: (extendedPoints[len - 1].y - extendedPoints[len - 3].y) / 2,
    };

    // Sample points along the catmull-rom curve for better fitting
    const sampleCount = Math.max(10, points.length * 3);
    const samples = [];

    for (let i = 0; i < sampleCount; i++) {
        const t = i / (sampleCount - 1);
        const segmentIndex = Math.min(Math.floor(t * (points.length - 1)), points.length - 2);
        const localT = t * (points.length - 1) - segmentIndex;

        // Evaluate catmull-rom at this point
        const p0 = extendedPoints[segmentIndex];
        const p1 = extendedPoints[segmentIndex + 1];
        const p2 = extendedPoints[segmentIndex + 2];
        const p3 = extendedPoints[segmentIndex + 3];

        const t2 = localT * localT;
        const t3 = t2 * localT;

        const sample = {
            x:
                0.5 *
                (2 * p1.x +
                    (-p0.x + p2.x) * localT +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y:
                0.5 *
                (2 * p1.y +
                    (-p0.y + p2.y) * localT +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        };
        samples.push(sample);
    }

    // Fit bezier using least squares on the sampled points
    // Start with tangent-based estimate
    const chordLength = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));

    let bestDistance1 = chordLength / 3;
    let bestDistance2 = chordLength / 3;
    let minError = Infinity;

    // Try different control point distances
    for (let scale1 = 0.1; scale1 <= 1.0; scale1 += 0.1) {
        for (let scale2 = 0.1; scale2 <= 1.0; scale2 += 0.1) {
            const d1 = (chordLength / 3) * scale1;
            const d2 = (chordLength / 3) * scale2;

            const startTangentLength = Math.sqrt(startTangent.x * startTangent.x + startTangent.y * startTangent.y);
            const endTangentLength = Math.sqrt(endTangent.x * endTangent.x + endTangent.y * endTangent.y);

            const c1 = {
                x: startPoint.x + (startTangent.x / startTangentLength) * d1,
                y: startPoint.y + (startTangent.y / startTangentLength) * d1,
            };

            const c2 = {
                x: endPoint.x - (endTangent.x / endTangentLength) * d2,
                y: endPoint.y - (endTangent.y / endTangentLength) * d2,
            };

            // Calculate error against samples
            let error = 0;
            for (let i = 0; i < samples.length; i++) {
                const t = i / (samples.length - 1);
                const bezierPoint = evaluateBezier(startPoint, c1, c2, endPoint, t);
                const dx = bezierPoint.x - samples[i].x;
                const dy = bezierPoint.y - samples[i].y;
                error += dx * dx + dy * dy;
            }

            if (error < minError) {
                minError = error;
                bestDistance1 = d1;
                bestDistance2 = d2;
            }
        }
    }

    // Calculate final control points
    const startTangentLength = Math.sqrt(startTangent.x * startTangent.x + startTangent.y * startTangent.y);
    const endTangentLength = Math.sqrt(endTangent.x * endTangent.x + endTangent.y * endTangent.y);

    const control1 = {
        x: (startTangent.x / startTangentLength) * bestDistance1,
        y: (startTangent.y / startTangentLength) * bestDistance1,
    };

    const control2 = {
        x: -(endTangent.x / endTangentLength) * bestDistance2,
        y: -(endTangent.y / endTangentLength) * bestDistance2,
    };

    return new BezierSegment(p5, { x: startPoint.x, y: startPoint.y }, control1, control2, {
        x: endPoint.x,
        y: endPoint.y,
    });
};

function evaluateBezier(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return {
        x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
        y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
}

export function Bezier(p5, segments, absolute = false) {
    this.segments = segments.map(([anchor1, control1, control2, anchor2]) => {
        return absolute
            ? new BezierSegment.fromAbsolute(p5, anchor1, control1, control2, anchor2)
            : new BezierSegment(p5, anchor1, control1, control2, anchor2);
    });

    this.render = () => {
        this.segments.forEach((segment) => segment.render());
    };

    this.renderFilled = () => {
        if (this.segments.length === 0) return;
        p5.beginShape();
        this.segments.forEach((segment, i) => {
            if (i === 0) {
                p5.vertex(segment.anchor1.x, segment.anchor1.y);
            }
            const c1x = segment.anchor1.x + segment.control1.x;
            const c1y = segment.anchor1.y + segment.control1.y;
            const c2x = segment.anchor2.x + segment.control2.x;
            const c2y = segment.anchor2.y + segment.control2.y;
            p5.bezierVertex(c1x, c1y, c2x, c2y, segment.anchor2.x, segment.anchor2.y);
        });
        p5.endShape(p5.CLOSE);
    };

    this.debug = () => {
        this.segments.forEach((segment) => segment.debug());
    };
}

Bezier.joinSegments = function (arc1, arc2) {
    // Average the connection points
    const connectionPoint = {
        x: (arc1.anchor2.x + arc2.anchor1.x) / 2,
        y: (arc1.anchor2.y + arc2.anchor1.y) / 2,
    };

    // Calculate distances
    const distance1 = Math.sqrt(arc1.control2.x * arc1.control2.x + arc1.control2.y * arc1.control2.y);
    const distance2 = Math.sqrt(arc2.control1.x * arc2.control1.x + arc2.control1.y * arc2.control1.y);

    // Average the directions
    const avgDirection = {
        x: arc1.control2.x - arc2.control1.x,
        y: arc1.control2.y - arc2.control1.y,
    };
    const avgLength = Math.sqrt(avgDirection.x * avgDirection.x + avgDirection.y * avgDirection.y);
    if (avgLength > 0) {
        avgDirection.x /= avgLength;
        avgDirection.y /= avgLength;
    }

    // Update anchors to the same connection point
    arc1.anchor2 = connectionPoint;
    arc2.anchor1 = connectionPoint;

    // Update relative control points to be collinear
    arc1.control2 = {
        x: avgDirection.x * distance1,
        y: avgDirection.y * distance1,
    };

    arc2.control1 = {
        x: -avgDirection.x * distance2,
        y: -avgDirection.y * distance2,
    };
    return [arc1, arc2];
};

Bezier.toSpline = function (segments) {
    return [segments[0]].concat(segments.map((segment) => segment[3])).flat();
};

export function splineToBezier(vertices) {
    if (vertices.length < 2) return [];

    // Add duplicate points at start and end for catmull-rom
    const extendedPoints = [vertices[0], ...vertices, vertices[vertices.length - 1]];

    const segments = [];

    // For each segment in the curve
    for (let i = 1; i < extendedPoints.length - 2; i++) {
        const p0 = extendedPoints[i - 1];
        const p1 = extendedPoints[i];
        const p2 = extendedPoints[i + 1];
        const p3 = extendedPoints[i + 2];

        // Calculate absolute control points
        const control1Abs = {
            x: p1.x + (p2.x - p0.x) / 6,
            y: p1.y + (p2.y - p0.y) / 6,
        };

        const control2Abs = {
            x: p2.x - (p3.x - p1.x) / 6,
            y: p2.y - (p3.y - p1.y) / 6,
        };

        // Convert to relative control points
        const control1Rel = {
            x: control1Abs.x - p1.x,
            y: control1Abs.y - p1.y,
        };

        const control2Rel = {
            x: control2Abs.x - p2.x,
            y: control2Abs.y - p2.y,
        };

        segments.push({
            anchor1: { x: p1.x, y: p1.y },
            control1: control1Rel,
            control2: control2Rel,
            anchor2: { x: p2.x, y: p2.y },
        });
    }

    return segments;
}

export function debugBezier(p5, anchor1, control1, control2, anchor2, color = '#ff0000') {
    p5.push();
    p5.stroke(color);
    p5.strokeWeight(1);
    p5.line(anchor1.x, anchor1.y, control1.x, control1.y);
    p5.line(anchor2.x, anchor2.y, control2.x, control2.y);
    p5.fill(color);
    p5.circle(anchor1.x, anchor1.y, 5);
    p5.circle(anchor2.x, anchor2.y, 5);
    p5.noFill();
    p5.circle(control1.x, control1.y, 5);
    p5.circle(control2.x, control2.y, 5);
    p5.pop();
}
