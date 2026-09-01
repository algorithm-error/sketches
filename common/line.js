export function Line(p5, vertices = []) {
    this.vertices = vertices;

    this.render = function () {
        p5.beginShape();
        this.vertices.forEach(({ x, y }, index) => {
            p5.vertex(x, y);
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
