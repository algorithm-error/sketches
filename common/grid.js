import { Array2D } from './array-2d.js';

export function Grid(p5, width, height, initialize = () => {}) {
    const array = new Array2D(width, height, (column, row) => initialize(p5, column, row));

    array.renderDots = function (cellSize = 20, color = '#ff0000') {
        p5.push();
        p5.strokeWeight(3);
        p5.stroke(color);
        this.forEach((columns, row) => {
            return columns.forEach((value, column) => {
                if (row === 0 && column === 0) {
                    p5.point(0, 0);
                }
                if (row === 0) {
                    p5.point((column + 1) * cellSize, 0);
                }
                if (column === 0) {
                    p5.point(0, (row + 1) * cellSize);
                }
                p5.point((column + 1) * cellSize, (row + 1) * cellSize);
            });
        });
        p5.pop();
    };

    /** @deprecated */
    array.render = array.renderDots;

    return array;
}

Grid.fromValues = function (p5, values) {
    const height = values.length;
    const width = values[0].length;
    return new Grid(p5, width, height, (p5, column, row) => values[row][column]);
};

Grid.reflectBoth = function (p5, grid) {
    return new Grid(p5, grid.width, grid.height, (p5, column, row) =>
        grid.get(grid.width - column - 1, grid.height - row - 1),
    );
};

Grid.reflectHorizontal = function (p5, grid) {
    return new Grid(p5, grid.width, grid.height, (p5, column, row) => grid.get(grid.width - column - 1, row));
};

Grid.reflectVertical = function (p5, grid) {
    return new Grid(p5, grid.width, grid.height, (p5, column, row) => grid.get(column, grid.height - row - 1));
};

Grid.sum = function (p5, first, second, origin = { column: 0, row: 0 }) {
    return new Grid(p5, first.width, first.height, (p5, column, row) => {
        const value1 = first.get(column, row) || 0;
        const value2 = second.get(column - origin.column, row - origin.row) || 0;
        return value1 + value2;
    });
};

Grid.join = Array2D.join;
