export function CurveShape(p5, vertices) {
    this.vertices = vertices;

    this.render = function () {
        p5.beginShape();
        this.vertices.forEach(({ x, y }, index, vertices) => {
            if (index === 0) {
                p5.curveVertex(vertices.at(-1).x, vertices.at(-1).y);
                p5.curveVertex(x, y);
                // Because the first and the last vertex are control points, you have to do add extra points to close the shape smoothly
                // See https://p5js.org/reference/p5/curveVertex/
            } else if (index === vertices.length - 1) {
                p5.curveVertex(x, y);
                p5.curveVertex(vertices.at(0).x, vertices.at(0).y);
                p5.curveVertex(vertices.at(1).x, vertices.at(1).y);
            } else {
                p5.curveVertex(x, y);
            }
        });
        p5.endShape();
    };

    this.debug = function () {
        p5.push();
        p5.stroke(0, 0, 255);
        p5.strokeWeight(5);
        p5.noFill();
        this.vertices.forEach(({ x, y }) => {
            p5.point(x, y);
        });

        p5.stroke(255, 0, 0);
        p5.point(vertices[0].x, vertices[0].y);
        p5.pop();
    };
}
