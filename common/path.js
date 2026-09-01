export function Path(p5, vertices = []) {
    this.vertices = vertices;
    this.reverse = () => this.vertices.reverse();
    this.getAngleAt = (point) => {
        const distances = this.vertices.map(({ x, y }) => p5.dist(x, y, point.x, point.y));
        const min = Math.min(...distances);
        const index = Math.min(distances.indexOf(min), this.vertices.length - 2);
        const closest = this.vertices[index];
        const direction = p5.createVector(point.x - closest.x, point.y - closest.y);
        const next = this.vertices[index + 1];
        const previous = this.vertices[index - 1];
        const vector1 = p5.createVector(next.x - closest.x, next.y - closest.y);
        if (previous) {
            const distance = p5.dist(previous.x, previous.y, next.x, next.y);
            const vector2 = p5.createVector(closest.x - previous.x, closest.y - previous.y);
            const bias = p5.dist(point.x, point.y, next.x, next.y) / distance;
            return vector1.heading() + vector1.angleBetween(vector2) * bias;
        } else {
            return vector1.heading();
        }
    };

    this.render = function () {
        p5.beginShape();
        const length = this.vertices.length;
        this.vertices.forEach(({ x, y }, index) => {
            p5.curveVertex(x, y);
            if (index === 0 || index === length - 1) {
                // First and last vertices are curve control points, so we are repeating them to get anchor points.
                p5.curveVertex(x, y);
            }
        });
        p5.endShape();
    };
}

export function refinePolygon(p5, vertices, targetCount) {
    const refined = [...vertices];
    if (targetCount <= vertices.length) {
        return refined;
    }
    const extraCount = targetCount - vertices.length;
    const perSide = Math.ceil(extraCount / vertices.length);
    const extraVertices = {};
    let count = 0;
    for (let index = 0; index < vertices.length; index++) {
        const v1 = vertices[index];
        const v2 = index + 1 <= vertices.length - 1 ? vertices[index + 1] : vertices[0];
        for (let extraIndex = 0; extraIndex < perSide; extraIndex++) {
            if (count >= extraCount) {
                break;
            }
            const amount = (1 / (perSide + 1)) * (extraIndex + 1);
            const x = p5.lerp(v1.x, v2.x, amount);
            const y = p5.lerp(v1.y, v2.y, amount);
            extraVertices[index * (perSide + 1) + extraIndex + 1] = { x, y };
            count++;
        }
    }
    for (let index in extraVertices) {
        refined.splice(Number(index), 0, extraVertices[index]);
    }
    return refined;
}

/** Refines spline by increasing its point count to targetCount. This count is evenly distributed between the splines egments. */
export function refineSpline(p5, vertices, targetCount) {
    const closed =
        vertices.length > 1 ? vertices[0].x === vertices.at(-1).x && vertices[0].y === vertices.at(-1).y : false;
    const refined = [...vertices];
    if (targetCount <= vertices.length) {
        return refined;
    }
    const extraCount = targetCount - vertices.length;
    const perSegment = Math.ceil(extraCount / vertices.length);
    const extraVertices = {};
    let count = 0;
    const length = vertices.length;
    for (let index = 0; index < length; index++) {
        if (index === length - 1) {
            break;
        }
        const v0 =
            index === 0 && closed ? vertices[length - 2] : index === 0 ? vertices[length - 1] : vertices[index - 1];
        const v1 = vertices[index];
        const v2 = vertices[index + 1];
        const v3 =
            index === length - 2 && closed ? vertices[1] : index === length - 2 ? vertices[0] : vertices[index + 2];
        for (let extraIndex = 0; extraIndex < perSegment; extraIndex++) {
            if (count >= extraCount) {
                break;
            }
            const amount = (1 / (perSegment + 1)) * (extraIndex + 1);
            const { x, y } = catmullRomPoint(v0, v1, v2, v3, amount);
            extraVertices[index * (perSegment + 1) + extraIndex + 1] = { x, y };
            count++;
        }
    }
    for (let index in extraVertices) {
        refined.splice(Number(index), 0, extraVertices[index]);
    }
    return refined;
}

/** Returns a point on a spline segment. t is between 0 and 1. */
function catmullRomPoint(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const b0 = -0.5 * t3 + t2 - 0.5 * t;
    const b1 = 1.5 * t3 - 2.5 * t2 + 1;
    const b2 = -1.5 * t3 + 2 * t2 + 0.5 * t;
    const b3 = 0.5 * t3 - 0.5 * t2;
    const x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x;
    const y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y;
    return { x: x, y: y };
}
