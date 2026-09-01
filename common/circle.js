export function Circle(p5, { x, y }, radius) {
    this.origin = { x, y };
    this.radius = radius;

    this.render = function () {
        p5.push();
        p5.strokeWeight(1);
        p5.stroke('#000000');
        p5.ellipse(this.origin.x, this.origin.y, this.radius * 2, this.radius * 2);
        p5.pop();
    };

    this.hasPoint = function ({ x, y }) {
        return p5.dist(x, y, this.origin.x, this.origin.y) <= this.radius;
    };
}
