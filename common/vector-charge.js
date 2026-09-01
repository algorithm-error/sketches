/** Magnetic charge for a vector field */
export function Charge(p5, x, y, charge) {
    this.position = p5.createVector(x, y);
    this.charge = charge;

    this.getForce = function (point) {
        const vector = p5.createVector(point.x, point.y);
        const force = P5.Vector.sub(vector, this.position);
        force.setMag((100000 * this.charge) / force.magSq());
        return force;
    };

    this.render = function () {
        p5.push();
        p5.noStroke();
        p5.fill(this.charge > 0 ? '#ff0000' : '#0000ff');
        p5.circle(this.position.x, this.position.y, 15);
        p5.pop();
    };
}
