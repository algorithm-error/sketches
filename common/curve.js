/** Catmull-rom spline curve, a basic curve in p5 */

export function Curve(p5, vertices = [], close = false) {
    this.vertices = vertices;
    // If the curve is explicitly closed, i.e. the first and the last points are the same, we will close it smoothly when rendering
    const closed =
        vertices.length > 1 ? vertices[0].x === vertices.at(-1).x && vertices[0].y === vertices.at(-1).y : false;

    this.render = function () {
        if (this.vertices.length < 2) return;
        p5.beginShape();
        const length = this.vertices.length;
        this.vertices.forEach(({ x, y }, index, vertices) => {
            if ((closed || close) && index === 0) {
                // If the path is closed, i.e. first and last points are the same, then we are using the next to last point as control point.
                // If the path isn't closed but we should close it when rendering, then it's the last point.
                const last = closed ? vertices[length - 2] : vertices[length - 1];
                p5.curveVertex(last.x, last.y);
            }
            p5.curveVertex(x, y);
            if ((closed || close) && index === length - 1) {
                const first = closed ? vertices[1] : vertices[0];
                p5.curveVertex(first.x, first.y);
            } else if (!closed && !close && (index === 0 || index === length - 1)) {
                // First and last vertices are curve control points, so we are repeating them to get anchor points.
                p5.curveVertex(x, y);
            }
        });
        p5.endShape();
    };

    this.debug = function () {
        p5.push();
        p5.strokeWeight(5);
        p5.stroke(255, 0, 0, 255);
        this.vertices.forEach(({ x, y }) => {
            p5.point(x, y);
        });
        p5.pop();
    };
}
