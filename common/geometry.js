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
