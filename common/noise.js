import '../libraries/poisson-disk-sampling.min.js';

export function poissonSample2d(p5, count, width, height) {
    let distance = width / Math.sqrt((count * height) / width);
    let sampling = new PoissonDiskSampling(
        {
            shape: [width, height],
            minDistance: distance * 0.8,
            maxDistance: distance * 1.6,
            tries: 15,
        },
        p5.random,
    );
    return sampling.fill().map(([x, y]) => ({ x, y }));
}

export function randomSample(p5, count, size) {
    return Array(count)
        .fill()
        .map(() => p5.random(0, size - 1));
}

export function randomSample2d(p5, count, width, height) {
    return Array(count)
        .fill()
        .map(() => ({
            x: Math.round(p5.random(0, width - 1)),
            y: Math.round(p5.random(0, height - 1)),
        }));
}

/** Returns a number of points on a line from point1 to point2 */
export function sampleAlongLine(p5, count, from, to, jitter = 0) {
    const vector = p5.createVector(to.x - from.x, to.y - from.y);
    const max = vector.mag();
    const heading = vector.heading();
    const perpHeading = heading + Math.PI / 2;
    return Array(count)
        .fill()
        .map(() => {
            const length = p5.random(0, max);
            const vector = P5.Vector.fromAngle(heading, length);
            const jitterOffset = P5.Vector.fromAngle(perpHeading, p5.random(-jitter, jitter));
            return { x: from.x + vector.x + jitterOffset.x, y: from.y + vector.y + jitterOffset.y };
        });
}

/** Returns a number of points along a bezier segment, spaced by uniform t with a noise-driven offset so density varies smoothly.
 *  `noiseFreq` controls how often density swells along the curve; `noiseAmp` controls how strongly. */
export function sampleAlongBezier(p5, count, segment, jitter = 0, noiseFreq = 2, noiseAmp = 0.15) {
    const p0 = segment.anchor1;
    const p3 = segment.anchor2;
    const p1 = { x: p0.x + segment.control1.x, y: p0.y + segment.control1.y };
    const p2 = { x: p3.x + segment.control2.x, y: p3.y + segment.control2.y };
    const noiseSeed = p5.random(1000);
    const ts = Array(count)
        .fill()
        .map((_, i) => {
            const uniform = count === 1 ? 0.5 : i / (count - 1);
            const offset = (p5.noise(uniform * noiseFreq + noiseSeed) - 0.5) * noiseAmp;
            return Math.min(1, Math.max(0, uniform + offset));
        });
    return ts.map((t) => {
        const mt = 1 - t;
        const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
        const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
        if (jitter === 0) return { x, y };
        const tx = 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
        const ty = 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
        const len = Math.sqrt(tx * tx + ty * ty) || 1;
        const j = p5.random(-jitter, jitter);
        return { x: x + (-ty / len) * j, y: y + (tx / len) * j };
    });
}

export const anchorSample = (p5, count, anchor, width, height) => {
    return Array(count)
        .fill()
        .map(() => ({
            x: Math.round(p5.random(0, width - 1) + anchor.x - width / 2),
            y: Math.round(p5.random(0, height - 1) + anchor.y - height / 2),
        }));
};

export function uniformPointInCircle(p5, origin, radius) {
    const distance = radius * Math.sqrt(p5.random());
    const angle = p5.random() * 2 * Math.PI;
    const x = origin.x + distance * Math.cos(angle);
    const y = origin.y + distance * Math.sin(angle);
    return { x, y };
}

export function circleSample(p5, count, origin, radius) {
    return Array(count)
        .fill()
        .map(() => uniformPointInCircle(p5, origin, radius));
}

/** Returns a random point from a uniform distribution within a convex polygon */
export function uniformPointInPolygon(p5, vertices) {
    // Input validation
    if (!vertices || vertices.length < 3) {
        throw new Error('At least 3 vertices required for polygon');
    }

    const vectors = vertices.map(({ x, y }) => p5.createVector(x, y));

    // Triangulate and calculate areas
    let triangles = [];
    let totalArea = 0;

    for (let i = 1; i < vectors.length - 1; i++) {
        let v1 = P5.Vector.sub(vectors[i], vectors[0]);
        let v2 = P5.Vector.sub(vectors[i + 1], vectors[0]);
        let area = 0.5 * Math.abs(v1.cross(v2).z);

        // Only add triangles with positive area
        if (area > 0) {
            triangles.push({ v0: vectors[0], v1: vectors[i], v2: vectors[i + 1], area: area });
            totalArea += area;
        }
    }

    // Handle edge case where no valid triangles exist
    if (triangles.length === 0 || totalArea === 0) {
        throw new Error('Invalid polygon: no area or degenerate triangles');
    }

    // Pick weighted random triangle
    let r = p5.random(totalArea);
    let sum = 0;
    let triangle = triangles[triangles.length - 1]; // Default fallback to last triangle

    for (let t of triangles) {
        sum += t.area;
        if (r <= sum) {
            triangle = t;
            break;
        }
    }

    // Random point in triangle using barycentric coordinates
    let r1 = p5.random(),
        r2 = p5.random();
    if (r1 + r2 > 1) {
        r1 = 1 - r1;
        r2 = 1 - r2;
    }

    let edge1 = P5.Vector.sub(triangle.v1, triangle.v0);
    let edge2 = P5.Vector.sub(triangle.v2, triangle.v0);
    return P5.Vector.add(triangle.v0, P5.Vector.add(P5.Vector.mult(edge1, r1), P5.Vector.mult(edge2, r2)));
}
