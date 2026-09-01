import { Array2D } from './array-2d.js';

export function CellGrid(p5, width, height, initialize = () => {}) {
    const array = new Array2D(width, height, initialize);

    array.render = function (cellSize = 20, getColor = (p5, value) => p5.map(value ?? 0, 0, 1, 255, 0)) {
        p5.push();
        p5.noStroke();
        this.traverse((column, row, value) => {
            const gray = getColor(p5, value);
            p5.fill(gray);
            p5.rect(column * cellSize, row * cellSize, cellSize, cellSize);
        });
        p5.pop();
    };

    return array;
}

CellGrid.fromValues = function (p5, values) {
    const height = values.length;
    const width = values[0].length;
    return new CellGrid(p5, width, height, (column, row) => values[row][column]);
};
