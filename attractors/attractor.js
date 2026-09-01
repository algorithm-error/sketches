export function Attractor(p5, position, velocity, mass, { g = 25, minDistanceSq = 100, maxDistanceSq = 1000 } = {}) {
    this.position = position;
    this.velocity = velocity;
    // this.velocity.mult(0.01)
    this.acceleration = new P5.Vector(0, 0);
    this.mass = mass;
    this.g = g;
    this.minDistanceSq = minDistanceSq;
    this.maxDistanceSq = maxDistanceSq;

    this.applyForce = (force) => {
        let acceleration = P5.Vector.div(force, this.mass);
        this.acceleration.add(acceleration);
    };

    this.update = () => {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.acceleration.set(0, 0);
    };

    this.attract = (mover) => {
        let force = P5.Vector.sub(this.position, mover.position);
        let distanceSq = p5.constrain(force.magSq(), this.minDistanceSq, this.maxDistanceSq);
        let strength = (this.g * (this.mass * mover.mass)) / distanceSq;
        force.setMag(strength);
        mover.applyForce(force);
    };
}
