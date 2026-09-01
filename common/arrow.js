export function Arrow(p5, from, to, color = '#000000') {
    this.from = from;
    this.to = to;
    this.color = color;

    this.render = function (headLength = 10, headAngle = Math.PI / 8) {
        const angle = Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x);

        p5.push();
        p5.stroke(this.color);

        p5.line(this.from.x, this.from.y, this.to.x, this.to.y);

        p5.line(
            this.to.x,
            this.to.y,
            this.to.x - headLength * Math.cos(angle - headAngle),
            this.to.y - headLength * Math.sin(angle - headAngle),
        );
        p5.line(
            this.to.x,
            this.to.y,
            this.to.x - headLength * Math.cos(angle + headAngle),
            this.to.y - headLength * Math.sin(angle + headAngle),
        );

        p5.pop();
    };
}
