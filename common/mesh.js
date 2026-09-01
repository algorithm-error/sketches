import { Grid } from './grid.js';

/**
 * Mesh wraps Grid to create a spatially-positioned grid with actual {x, y} coordinates.
 * Compared to Grid (which is just a data structure), Mesh interpolates positions between
 * 4 corner points, allowing for warped/perspective grids (e.g., trapezoids, quads).
 */
export function Mesh(p5, columns, rows, [topleft, topright, bottomright, bottomleft]) {
    const lines = new Array(rows).fill(undefined).map((value, index) => {
        const x1 = p5.map(index, 0, rows - 1, topleft.x, bottomleft.x);
        const y1 = p5.map(index, 0, rows - 1, topleft.y, bottomleft.y);
        const x2 = p5.map(index, 0, rows - 1, topright.x, bottomright.x);
        const y2 = p5.map(index, 0, rows - 1, topright.y, bottomright.y);
        const vertices = new Array(columns).fill(undefined).map((value, index) => {
            const x = p5.map(index, 0, columns - 1, x1, x2);
            const y = p5.map(index, 0, columns - 1, y1, y2);
            return { x, y };
        });
        return vertices;
    });

    this.grid = new Grid(p5, columns, rows, (p5, column, row) => lines[row][column]);

    this.render = function () {
        this.grid.traverse((column, row, { x, y }) => {
            p5.point(x, y);
        });
    };
}
