import { Grid } from './grid.js';

const getNoiseValue = (p5, column, row) => {
    // FIXME Remove noise increment
    const noiseIncrement = 0.01;
    return p5.noise(column * noiseIncrement, row * noiseIncrement);
};

export function FlowLine(p5, { column, row, cellSize, radius, angle, color = [255, 0, 0, 50] }) {
    this.angle = angle;
    this.radius = radius !== undefined ? radius : cellSize / 2;
    this.vector = P5.Vector.fromAngle(this.angle, this.radius);
    this.anchor = { x: column * cellSize, y: row * cellSize };

    this.render = () => {
        p5.push();
        this.vector = P5.Vector.fromAngle(this.angle, this.radius);
        const { x: x1, y: y1 } = this.anchor;
        const { x: x2, y: y2 } = { x: this.anchor.x + this.vector.x, y: this.anchor.y + this.vector.y };
        p5.strokeWeight(1);
        p5.stroke(color);
        p5.line(x1, y1, x2, y2);

        // Dot at the end
        p5.strokeWeight(3);
        p5.stroke(color);
        p5.point(x2, y2);
        p5.pop();
    };
}

// FIXME Rename width and height to columns and rows
export function FlowField(p5, { width, height, cellSize = 20, initialize = getNoiseValue }) {
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
        return this.values[row][column];
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
                return { value, weight: cellDiagonal - distance };
            });
        // This avoids unexpected averages in cases when some values are 6.2 and others are 0.1
        weights.forEach((weighted, index, weights) => {
            if (index === 0) {
                return;
            }
            const delta = weights[index - 1].value - weighted.value;
            weighted.value =
                Math.abs(delta) > Math.PI ? weighted.value + (delta > 0 ? Math.PI * 2 : -Math.PI * 2) : weighted.value;
        });
        if (weights.length === 0) {
            return undefined;
        }
        const totalWeight = weights.reduce((sum, { weight }) => sum + weight, 0);
        return weights.reduce((sum, { value, weight }) => sum + value * weight, 0) / totalWeight;
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

    /** @deprecated */
    this.render = () => {
        this.values.traverse((column, row, value) => {
            const line = new FlowLine(p5, { column, row, cellSize, angle: value });
            line.render();
        });
    };

    this.renderVectors = (color = [255, 0, 0, 50]) => {
        this.values.traverse((column, row, value) => {
            const line = new FlowLine(p5, { column, row, cellSize, angle: value, color });
            line.render();
        });
    };

    this.renderGrid = () => {
        p5.push();
        p5.noStroke();
        this.values.traverse((column, row, value) => {
            const color = p5.map(value, -1, 1, 0, 255);
            p5.fill(color);
            p5.rect(column * cellSize, row * cellSize, cellSize, cellSize);
        });
        p5.pop();
    };

    this.forEach = (predicate) => {
        this.values.forEach((columns, row, rows) =>
            columns.forEach((value, column, columns) => {
                const point = { value, column, row, x: column * cellSize, y: row * cellSize };
                const left = {
                    value: columns[column - 1],
                    column: column - 1,
                    row,
                    x: (column - 1) * cellSize,
                    y: row * cellSize,
                };
                const right = {
                    value: columns[column + 1],
                    column: column + 1,
                    row,
                    x: (column + 1) * cellSize,
                    y: row * cellSize,
                };
                const top = {
                    value: rows[row - 1]?.[column],
                    column,
                    row: row - 1,
                    x: column * cellSize,
                    y: (row - 1) * cellSize,
                };
                const bottom = {
                    value: rows[row + 1]?.[column],
                    column,
                    row: row + 1,
                    x: column * cellSize,
                    y: (row + 1) * cellSize,
                };

                predicate(point, left, right, top, bottom);
            }),
        );
    };

    // FIXME Consider moving to Grid
    this.falloff = function (predicate = (p5, distance, radius, value) => value * (1 - distance / radius)) {
        const center = {
            column: Math.round(this.width / 2),
            row: Math.round(this.height / 2),
        };
        const radius = Math.min(center.column, center.row);
        this.values.traverse((column, row, value) => {
            const distance = Math.min(p5.dist(column, row, center.column, center.row), radius);
            const falloff = predicate(p5, distance, radius, value);
            this.values.set(column, row, falloff);
        });
    };

    this.reflectBoth = function () {
        this.values = Grid.reflectBoth(p5, this.values);
        this.values.traverse((column, row, value) => {
            this.values.set(column, row, value > p5.PI ? value - p5.PI : p5.PI - value);
        });
    };
    this.reflectHorizontal = function () {
        this.values = Grid.reflectHorizontal(p5, this.values);
        this.values.traverse((column, row, value) => {
            this.values.set(column, row, -value - p5.PI);
        });
    };
    this.reflectVertical = function () {
        this.values = Grid.reflectVertical(p5, this.values);
        // TODO
    };
}
