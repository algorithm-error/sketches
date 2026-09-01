export function getCenter(polygon) {
    const x = polygon.reduce((sum, { x }) => sum + x, 0);
    const y = polygon.reduce((sum, { y }) => sum + y, 0);
    return { x: x / polygon.length, y: y / polygon.length };
}

/** Removes the last vertex if it's the same as the first */
export function getOpenPolygon(polygon = []) {
    const start = polygon[0];
    const end = polygon[polygon.length - 1];
    return start.x === end.x && start.y === end.y ? polygon.slice(0, -1) : polygon;
}

export function getPolygonLines(polygon = []) {
    const open = getOpenPolygon(polygon);
    return open.reduce((lines, vertex, index, vertices) => {
        if (index === 0) {
            return lines;
        }
        const start = vertices[index - 1];
        lines.push([start, vertex]);
        if (index === vertices.length - 1) {
            lines.push([vertex, vertices[0]]);
        }
        return lines;
    }, []);
}

/** Detects if polygon is clockwise. Convex only. */
export function isClockwise(polygon = []) {
    const sum = polygon.reduce((sum, { x: x1, y: y1 }, index, polygon) => {
        const { x: x2, y: y2 } = polygon[index + 1] || polygon[0];
        sum += (x2 - x1) * (y2 + y1);
        return sum;
    }, 0);
    return sum > 0;
}

/** Changes polygon starting point */
export function changePolygonStart(polygon, startFrom = 0) {
    if (typeof startFrom === 'function') {
        const index = startFrom(polygon);
        return index === 0 ? polygon : polygon.slice(index).concat(polygon.slice(0, index));
    } else {
        return startFrom === 0 ? polygon : polygon.slice(startFrom).concat(polygon.slice(0, startFrom));
    }
}

export const getFacingSides = (p5, sides = [], reverse = false) => {
    return sides.filter(([{ x: x1, y: y1 }, { x: x2, y: y2 }]) => {
        const relative = { x: x2 - x1, y: y2 - y1 };
        const vector = p5.createVector(relative.x, relative.y);
        // heading returns angle from -180 to 180
        const halfAngle = vector.heading();
        const fullAngle = halfAngle >= 0 ? halfAngle : Math.PI * 2 + halfAngle;
        if (reverse) {
            return fullAngle < Math.PI / 2 || fullAngle > (Math.PI / 2) * 3;
        } else {
            return fullAngle > Math.PI / 2 && fullAngle < (Math.PI / 2) * 3;
        }
    });
};

export const absoluteToRelativePolygon = (polygon, origin) => {
    return polygon.map(({ x, y }) => ({ x: x - origin.x, y: y - origin.y }));
};
export const relativeToAbsolutePolygon = (polygon, origin) => {
    return polygon.map((x, y) => ({ x: x + origin.x, y: y + origin.y }));
};

export const movePolygon = (polygon = [], offset = { x: 0, y: 0 }) => {
    return polygon.map(({ x, y }) => ({ x: x + offset.x, y: y + offset.y }));
};

/** Moves polygon to the origin, which is at the top left point of the polygin */
export const movePolygonToOrigin = (polygon = []) => {
    const x = Math.min.apply(
        undefined,
        polygon.map((vertex) => vertex.x),
    );
    const y = Math.min.apply(
        undefined,
        polygon.map((vertex) => vertex.y),
    );
    return movePolygon(polygon, { x: -x, y: -y });
};

// FIXME Rewrite with vector math
export const rotatePolygon = (vertices = [], origin = { x: 0, y: 0 }, radians = 0) => {
    return vertices.map(({ x, y }) => {
        const dx = x - origin.x;
        const dy = y - origin.y;
        return {
            x: origin.x + dx * Math.cos(radians) - dy * Math.sin(radians),
            y: origin.y + dx * Math.sin(radians) + dy * Math.cos(radians),
        };
    });
};

// FIXME Rewrite with vector math
export function scalePolygon(polygon, factor, origin = undefined) {
    origin = origin !== undefined ? origin : getCenter(polygon);

    factor = typeof factor === 'number' ? { x: factor, y: factor } : factor;
    return polygon.map((point) => ({
        x: origin.x + (point.x - origin.x) * factor.x,
        y: origin.y + (point.y - origin.y) * factor.y,
    }));
}

// Produces funny "sharp teeth" effect when joining adjacent voronoi cells together
export function getOverlappingPolygonUnion(polygons = []) {
    const allPoints = polygons.flat().filter((p, index, self) => {
        return index === self.findIndex((t) => t.x === p.x && t.y === p.y);
    });

    // Sort points by polar angle
    const center = getCenter(allPoints);
    allPoints.sort((a, b) => {
        return Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x);
    });

    return allPoints;
}

/** Detects that polygons touch at least on one side. */
export const getTouchingSide = (polygon1, polygon2, threshold = 1) => {
    const sides = getPolygonLines(polygon1);
    return sides.find((side) => {
        // Neighboring side has opposite direction
        const [start1, end1] = [...side].reverse();
        return polygon2.find((end2, index, vertices) => {
            const start2 = index === 0 ? vertices[vertices.length - 1] : vertices[index - 1];
            return (
                Math.abs(start1.x - start2.x) < threshold &&
                Math.abs(start1.y - start2.y) < threshold &&
                Math.abs(end1.x - end2.x) < threshold &&
                Math.abs(end1.y - end2.y) < threshold
            );
        });
    });
};

export const getClosestPoints = (p5, polygon1, polygon2) => {
    const grid = polygon1.map(({ x: x1, y: y1 }) => {
        return polygon2.map(({ x: x2, y: y2 }) => {
            return p5.dist(x1, y1, x2, y2);
        });
    });
    const flat = grid.flat();
    const min = Math.min.apply(null, flat);
    const index = flat.indexOf(min);
    const index1 = Math.floor(index / polygon2.length);
    const index2 = index % polygon2.length;
    return [polygon1[index1], polygon2[index2]];
};

export const getClosestPoint = (p5, point, polygon) => {
    return polygon.reduce((closest, next) => {
        const distance1 = p5.dist(closest.x, closest.y, point.x, point.y);
        const distance2 = p5.dist(next.x, next.y, point.x, point.y);
        return distance2 < distance1 ? next : closest;
    }, polygon[0]);
};

export const getClosestPointIndex = (p5, point, polygon) => {
    return polygon.reduce((closestIndex, next, index) => {
        const closest = polygon[closestIndex];
        const distance1 = p5.dist(closest.x, closest.y, point.x, point.y);
        const distance2 = p5.dist(next.x, next.y, point.x, point.y);
        return distance2 < distance1 ? index : closestIndex;
    }, 0);
};

export const getPolygonDirection = (p5, polygon) => {
    if (polygon.length < 2) {
        return 0;
    }
    const { x: x1, y: y1 } = polygon[0];
    const { x: x2, y: y2 } = polygon.slice(-1)[0];
    const vector = p5.createVector(x1 - x2, y1 - y2);
    return vector.heading();
};

/** Mean of the headings of every segment, each counted once regardless of its
 *  length — the direction a traced path drifts in, which the first-to-last
 *  vector of getPolygonDirection misreports as soon as the path loops. */
export const getAverageDirection = (p5, polygon = []) => {
    const sum = p5.createVector(0, 0);
    for (let index = 1; index < polygon.length; index++) {
        const { x: x1, y: y1 } = polygon[index - 1];
        const { x: x2, y: y2 } = polygon[index];
        const segment = p5.createVector(x2 - x1, y2 - y1);
        if (segment.magSq() > 0) {
            sum.add(segment.normalize());
        }
    }
    return sum.heading();
};

export const isPointInPolygon = (point, polygon) => {
    const { x, y } = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const { x: x1, y: y1 } = polygon[i];
        const { x: x2, y: y2 } = polygon[j];
        // Raycasting algorithm
        // https://wrfranklin.org/Research/Short_Notes/pnpoly.html
        const intersect = y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;
        inside = intersect ? !inside : inside;
    }

    return inside;
};

export function isPointInCircle(point, origin, radius) {
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    return Math.pow(dx, 2) + Math.pow(dy, 2) <= Math.pow(radius, 2);
}

export function isPointInEllipse(point, origin, radiusX, radiusY) {
    let dx = point.x - origin.x;
    let dy = point.y - origin.y;
    return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
}

export function getPolygonPerimeter(p5, polygon) {
    return polygon.reduce((perimeter, point, index, polygon) => {
        if (index === polygon.length - 1) {
            return perimeter;
        }
        const { x: x1, y: y1 } = polygon[index];
        const { x: x2, y: y2 } = polygon[index + 1];
        return perimeter + p5.dist(x1, y1, x2, y2);
    }, 0);
}

export function simplifyPolygon(p5, polygon, threshold = 10) {
    const optimized = [...polygon];
    let i = 0;
    while (i < optimized.length) {
        const isLast = i === optimized.length - 1;
        const { x: x1, y: y1 } = optimized[i];
        const { x: x2, y: y2 } = optimized[isLast ? 0 : i + 1];
        if (p5.dist(x1, y1, x2, y2) < threshold) {
            const average = { x: (x1 - x2) / 2 + x1, y: (y1 - y1) / 2 + y1 };
            if (isLast) {
                optimized[i] = average;
                optimized.splice(0, 1);
            } else {
                optimized.splice(i, 2, average);
            }
        }
        i++;
    }
    return optimized;
}

/**
 * Removes the tips of spikes: points where the outline goes out and comes straight
 * back along the same line. Points in the middle of a straight side stay. Repeats
 * until nothing changes, since removing a tip can leave a shorter spike behind it.
 */
export function removeSpikes(polygon, tolerance = 1e-9) {
    const cleaned = [...polygon];
    let removed = true;
    while (removed && cleaned.length > 2) {
        removed = false;
        for (let i = 0; i < cleaned.length && cleaned.length > 2; i++) {
            const previous = cleaned[(i - 1 + cleaned.length) % cleaned.length];
            const point = cleaned[i];
            const next = cleaned[(i + 1) % cleaned.length];
            const inX = point.x - previous.x;
            const inY = point.y - previous.y;
            const outX = next.x - point.x;
            const outY = next.y - point.y;
            // On one line, and the way out points back the way we came in.
            const collinear = Math.abs(inX * outY - inY * outX) <= tolerance;
            const reverses = inX * outX + inY * outY < 0;
            if (collinear && reverses) {
                cleaned.splice(i, 1);
                i--;
                removed = true;
            }
        }
    }
    return cleaned;
}

/** Given a ploygon and an array of indexes to slice at, returns the slices */
export function slicePolygon(p5, vertices = [], sliceAtIndexes = []) {
    const slices = [];
    for (let index = 0; index < sliceAtIndexes.length; index++) {
        if (index === 0) {
            continue;
        }
        slices.push(vertices.slice(sliceAtIndexes[index - 1], sliceAtIndexes[index]));
    }
    return slices;
}

/** Returns the point where two line segments cross, or undefined */
export function getLineIntersection(line1, line2) {
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = line1;
    const [{ x: x3, y: y3 }, { x: x4, y: y4 }] = line2;
    const denominator = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (denominator === 0) {
        return undefined;
    }
    const amount1 = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / denominator;
    const amount2 = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / denominator;
    if (amount1 < 0 || amount1 > 1 || amount2 < 0 || amount2 > 1) {
        return undefined;
    }
    return { x: x1 + amount1 * (x2 - x1), y: y1 + amount1 * (y2 - y1) };
}

/** Returns the points where two paths cross each other */
export function getPathIntersections(path1 = [], path2 = []) {
    const points = [];
    for (let index1 = 0; index1 < path1.length - 1; index1++) {
        const line1 = [path1[index1], path1[index1 + 1]];
        const minX = Math.min(line1[0].x, line1[1].x);
        const maxX = Math.max(line1[0].x, line1[1].x);
        const minY = Math.min(line1[0].y, line1[1].y);
        const maxY = Math.max(line1[0].y, line1[1].y);
        for (let index2 = 0; index2 < path2.length - 1; index2++) {
            const line2 = [path2[index2], path2[index2 + 1]];
            if (Math.min(line2[0].x, line2[1].x) > maxX || Math.max(line2[0].x, line2[1].x) < minX) {
                continue;
            }
            if (Math.min(line2[0].y, line2[1].y) > maxY || Math.max(line2[0].y, line2[1].y) < minY) {
                continue;
            }
            const point = getLineIntersection(line1, line2);
            if (point) {
                points.push(point);
            }
        }
    }
    return points;
}

/** Returns the point of a path that is closest to the given point, including points inside the segments */
export function getClosestPointOnPath(point, path = []) {
    let closest = path[0];
    let closestDistance = Infinity;
    for (let index = 0; index < path.length - 1; index++) {
        const start = path[index];
        const end = path[index + 1];
        const x = end.x - start.x;
        const y = end.y - start.y;
        const lengthSquared = x * x + y * y;
        const amount =
            lengthSquared === 0 ? 0 : ((point.x - start.x) * x + (point.y - start.y) * y) / lengthSquared;
        const clamped = Math.max(0, Math.min(1, amount));
        const candidate = { x: start.x + clamped * x, y: start.y + clamped * y };
        const distance = (candidate.x - point.x) ** 2 + (candidate.y - point.y) ** 2;
        if (distance < closestDistance) {
            closestDistance = distance;
            closest = candidate;
        }
    }
    return closest;
}

/** Returns the point of a path at the given distance from the starting point, a negative distance walks backwards */
export function getPointAlongPath(path = [], point, distance) {
    let index = 0;
    let closest = path[0];
    let closestDistance = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i + 1];
        const x = end.x - start.x;
        const y = end.y - start.y;
        const lengthSquared = x * x + y * y;
        const amount = lengthSquared === 0 ? 0 : ((point.x - start.x) * x + (point.y - start.y) * y) / lengthSquared;
        const clamped = Math.max(0, Math.min(1, amount));
        const candidate = { x: start.x + clamped * x, y: start.y + clamped * y };
        const candidateDistance = (candidate.x - point.x) ** 2 + (candidate.y - point.y) ** 2;
        if (candidateDistance < closestDistance) {
            closestDistance = candidateDistance;
            closest = candidate;
            index = i;
        }
    }
    const step = distance < 0 ? -1 : 1;
    let left = Math.abs(distance);
    let current = closest;
    // Walks the path segment by segment until the distance is used up
    for (let i = step < 0 ? index : index + 1; i >= 0 && i < path.length; i += step) {
        const next = path[i];
        const length = Math.hypot(next.x - current.x, next.y - current.y);
        if (length >= left) {
            const amount = length === 0 ? 0 : left / length;
            return { x: current.x + (next.x - current.x) * amount, y: current.y + (next.y - current.y) * amount };
        }
        left -= length;
        current = next;
    }
    return current;
}
