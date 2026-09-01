/**
 * Chains every live cell of a sparse binary grid into one or more nearest-neighbor paths,
 * suitable for feeding into Curve as open splines. This is the nearest-neighbor TSP heuristic:
 * from the current cell, hop to the closest not-yet-visited cell; if none remain within `gap`
 * empty cells (in any of the 8 directions), end the chain and start a new one from a leftover cell.
 */

const key = (row, col) => `${row},${col}`;

function findLiveCells(grid) {
    const cells = [];
    grid.forEach((rowValues, row) => {
        rowValues.forEach((value, col) => {
            if (value) cells.push([row, col]);
        });
    });
    return cells;
}

// Nearest still-unvisited cell within `threshold` cells (Chebyshev distance), or null if none.
function findNearestUnvisited(unvisited, [row, col], threshold) {
    let best = null;
    let bestKey = null;
    let bestDistance = Infinity;
    for (const [k, [r, c]] of unvisited) {
        if (Math.max(Math.abs(r - row), Math.abs(c - col)) > threshold) continue;
        const distance = (r - row) ** 2 + (c - col) ** 2;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = [r, c];
            bestKey = k;
        }
    }
    return best ? { cell: best, key: bestKey } : null;
}

/**
 * @param {number[][]} grid - 2D array of 0/1 values.
 * @param {number} gap - number of empty cells that still count as "close enough" to hop to (default 1).
 * @returns {{row: number, col: number}[][]} one or more open chains, together covering every live cell.
 */
export function chainDots(grid, gap = 1) {
    const threshold = gap + 1;
    const unvisited = new Map(findLiveCells(grid).map(([row, col]) => [key(row, col), [row, col]]));
    const chains = [];

    while (unvisited.size > 0) {
        const startKey = unvisited.keys().next().value;
        let current = unvisited.get(startKey);
        unvisited.delete(startKey);
        const chain = [current];

        while (true) {
            const nearest = findNearestUnvisited(unvisited, current, threshold);
            if (!nearest) break;
            chain.push(nearest.cell);
            unvisited.delete(nearest.key);
            current = nearest.cell;
        }

        chains.push(chain.map(([row, col]) => ({ row, col })));
    }

    return chains;
}
