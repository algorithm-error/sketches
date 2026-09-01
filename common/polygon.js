export function Polygon(p5, vertices) {
    this.vertices = vertices;

    this.render = function () {
        p5.beginShape();
        this.vertices.forEach(({ x, y }) => {
            p5.vertex(x, y);
        });
        p5.endShape(p5.CLOSE);
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
