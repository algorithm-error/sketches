import { Grid } from './grid.js';
import { FlowLine } from './flow-field.js';

const getNoiseValue = (p5, column, row) => {
    const noiseIncrement = 0.01;
    const angle = p5.noise(column * noiseIncrement, row * noiseIncrement);
    return P5.Vector.fromAngle(angle, 1);
};

// FIXME Rename width and height to columns and rows
export function VectorField(p5, { width, height, cellSize = 20, initialize = getNoiseValue }) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.values = new Grid(p5, width, height, initialize);
    const cellDiagonal = p5.dist(0, 0, cellSize, cellSize);

    const isInBounds = ({ column, row }, { width, height }) => {
        return column >= 0 && row >= 0 && column <= width - 1 && row <= height - 1;
    };

    /** Gets closest vector to the point specified in pixels */
    this.getValueAtPoint = ({ x, y }) => {
        const column = Math.round(x / cellSize);
        const row = Math.round(y / cellSize);
        if (!isInBounds({ column, row }, { width, height })) {
            return undefined;
        }
        return this.values[row][column].angle;
    };

    this.getWeightedAverageAt = ({ x, y }) => {
        const column = x / cellSize;
        const row = y / cellSize;
        const anchor1 = { row: Math.floor(row), column: Math.floor(column) };
        const anchor2 = { row: Math.floor(row), column: Math.ceil(column) };
        const anchor3 = { row: Math.ceil(row), column: Math.ceil(column) };
        const anchor4 = { row: Math.ceil(row), column: Math.floor(column) };
        const weights = [anchor1, anchor2, anchor3, anchor4]
            .filter(({ column, row }) => isInBounds({ column, row }, { width, height }))
            .map(({ column, row }) => {
                const value = this.values[row][column];
                const distance = p5.dist(x, y, column * cellSize, row * cellSize);
                return { value: p5.createVector(value.x, value.y), weight: cellDiagonal - distance };
            });
        // This avoids unexpected averages in cases when some values are 6.2 and others are 0.1
        weights.forEach((weighted, index, weights) => {
            if (index === 0) {
                return;
            }
            const heading = weighted.value.heading();
            const delta = weights[index - 1].value.heading() - heading;
            if (Math.abs(delta) > Math.PI) {
                weighted.value.setHeading(heading + (delta > 0 ? Math.PI * 2 : -Math.PI * 2));
            }
        });
        if (weights.length === 0) {
            return undefined;
        }
        const totalWeight = weights.reduce((sum, { weight }) => sum + weight, 0);
        const sum = weights.reduce(
            (sum, { value: vector, weight }) => {
                vector.mult(weight);
                return sum.add(vector);
            },
            p5.createVector(0, 0),
        );
        return sum.mult(1 / totalWeight);
    };

    this.get = ({ column, row }) => {
        return this.values[row]?.[column];
    };

    this.set = ({ column, row }, value) => {
        if (this.values[row]?.[column] === undefined) {
            return;
        }
        return (this.values[row][column] = value);
    };

    this.renderVectors = () => {
        this.values.traverse((column, row, vector) => {
            vector.setHeading(vector.heading() + p5.PI);
            const line = new FlowLine(p5, { column, row, cellSize, radius: vector.mag(), angle: vector.heading() });
            line.render();
        });
    };
}

VectorField.fromValues = function (p5, { values, cellSize }) {
    const width = values[0].length;
    const height = values.length;
    const initialize = (p5, column, row) => {
        const value = values[row][column];
        const vector = p5.createVector(value.x, value.y);
        return vector;
    };

    return new VectorField(p5, { width, height, cellSize, initialize });
};
