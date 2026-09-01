export function QuadraticBezier(p5, p5bezier, vertices = []) {
    this.vertices = vertices;
    this.render = function () {
        p5bezier.draw(this.vertices.map(({ x, y }) => [x, y]));
    };
    this.debug = function () {
        debugQuadraticBezier(p5, this.vertices);
    };
}

export function debugQuadraticBezier(p5, vertices = [], color = '#ff0000') {
    p5.push();
    p5.stroke(color);
    vertices.forEach(({ x, y }, index, vertices) => {
        p5.strokeWeight(5);
        p5.point(x, y);
        if (index > 0) {
            const previous = vertices[index - 1];
            p5.strokeWeight(1);
            p5.line(x, y, previous.x, previous.y);
        }
    });
    p5.pop();
}
