import { uniformPointInCircle, uniformPointInPolygon } from './noise.js';
import { Curve } from './curve.js';
import { isPointInEllipse, rotatePolygon } from './geometry.js';
import { Polygon } from './polygon.js';
import { QuadraticBezier } from './quadratic-bezier.js';

function getPointInDomain(p5, cell, circle) {
    const attempts = 10;
    let point;
    for (let i = 0; i < attempts; i++) {
        point = uniformPointInPolygon(p5, cell);
        if (isPointInEllipse(point, circle.origin, circle.radiusX, circle.radiusY)) {
            return point;
        }
    }
    return point;
}

export function SquiggleGenerator(
    p5,
    { origin, radius, scaleX, tilt, count } = {
        origin: { x: 100, y: 200 },
        radius: 50,
        scaleX: 0.5,
        tilt: Math.PI / 4,
        count: 5,
    },
) {
    const circle = { origin, radiusX: radius * scaleX, radiusY: radius };
    let centroids = new Array(count).fill().map(() => {
        const { x, y } = uniformPointInCircle(p5, { x: 0, y: 0 }, radius);
        return { x: x * scaleX + radius / 2, y: y + radius };
    });

    p5.voronoiSites(centroids.map(({ x, y }) => [x, y]));
    p5.voronoi(radius * 2 * scaleX, radius * 2);

    const cells = p5.voronoiGetCells().map((cell) => cell.map(([x, y]) => ({ x, y })));

    this.getSquiggle = () => {
        return new Squiggle(p5, { cells, circle, tilt, centroids });
    };
}

function Squiggle(p5, { cells, circle, tilt, centroids } = { cells, circle, tilt, centroids }) {
    let vertices = cells
        .filter((cell) => cell.length > 0)
        .map((cell) => {
            return getPointInDomain(p5, cell, circle);
        });

    vertices.sort((first, second) => {
        const vector1 = p5.createVector(first.x, first.y);
        const vector2 = p5.createVector(second.x, second.y);
        return vector1.heading() - vector2.heading();
    });
    this.vertices = rotatePolygon(vertices, circle.origin, tilt);

    this.debug = () => {
        p5.push();
        p5.strokeWeight(1);
        cells.forEach((vertices) => {
            const polygon = new Polygon(p5, vertices);
            polygon.render();
        });
        p5.strokeWeight(1);
        p5.ellipse(circle.origin.x, circle.origin.y, circle.radiusX * 2, circle.radiusY * 2);

        p5.strokeWeight(1);
        vertices = rotatePolygon(vertices, circle.origin, tilt);
        centroids.forEach(({ x, y }) => {
            p5.circle(x, y, 8);
        });
        p5.strokeWeight(5);
        vertices.forEach(({ x, y }) => {
            p5.point(x, y);
        });
        p5.pop();
    };

    this.render = () => {
        const glyph = new Curve(p5, this.vertices);
        glyph.render();
    };
}
