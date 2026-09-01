function getVertex(vertex, value, step, repellers = [], attractors = [], forces = [], reverse = false) {
    if (reverse) {
        value = value > p5.PI ? value - p5.PI : p5.PI - value;
    }
    let flow = P5.Vector.fromAngle(value, step);
    const nextVertex = { x: vertex.x + flow.x, y: vertex.y + flow.y };
    if (repellers.length > 0) {
        for (const repeller of repellers) {
            flow = repeller.repel(nextVertex, flow);
        }
    }
    if (attractors.length > 0) {
        for (const attractor of attractors) {
            const force = attractor.getForce(nextVertex);
            flow.add(force);
        }
    }
    for (const force of forces) {
        flow.add(force.x, force.y);
    }
    return { x: vertex.x + flow.x, y: vertex.y + flow.y };
}

export function FlowCurve(
    p5,
    {
        flowField,
        attractors = [],
        repellers = [],
        forces = [],
        start,
        steps,
        step = 10,
        label,
        follow = getVertex,
        reverse = false,
    },
) {
    this.label = label;
    this.vertices = [start];
    for (let i = 0; i < steps; i++) {
        const vertex = this.vertices[i];
        let value = flowField.getWeightedAverageAt(vertex);
        if (value === undefined) {
            break;
        }
        const nextVertex = follow(vertex, value, step, repellers, attractors, forces, reverse);
        this.vertices.push(nextVertex);
    }

    this.render = (color = '#000000') => {
        p5.beginShape();
        const length = this.vertices.length;
        this.vertices.forEach(({ x, y }, index) => {
            p5.curveVertex(x, y);
            if (index === 0 || index === length - 1) {
                // First and last vertices are curve control points, so we are repeating them to get anchor points.
                p5.curveVertex(x, y);
            }
        });
        p5.endShape();
    };

    this.debug = () => {
        p5.strokeWeight(5);
        p5.stroke(255, 0, 0, 255);
        this.vertices.forEach(({ x, y }) => {
            p5.point(x, y);
        });
    };

    this.renderStartingVertex = () => {
        p5.strokeWeight(5);
        p5.stroke(255, 0, 0, 255);
        p5.point(this.vertices[0].x, this.vertices[0].y);
    };

    this.reflow = function () {
        this.vertices.reverse();
    };
}

FlowCurve.fromVertices = function (p5, vertices) {
    const curve = new FlowCurve(p5, { flowField: undefined, start: vertices[0], steps: 0 });
    curve.vertices = vertices;
    return curve;
};

FlowCurve.merge = function (p5, curves = [], offset = 3) {
    const first = curves[0].vertices.slice(0, -offset);
    const second = curves[1].vertices;
    const vertices = [...first, ...second];
    const curve = new FlowCurve(p5, { flowField: undefined, start: vertices[0], steps: 0 });
    curve.vertices = vertices;
    return curve;
};
