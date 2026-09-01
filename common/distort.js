/** Add blobs to the grid, mutating it */
export function addBlobs(p5, grid, spreadPoints, radii) {
    const outsidePointsAt = [];
    /** Array of inside points for each spread point */
    const insidePointsAt = spreadPoints.map(() => []);

    grid.traverse((column, row, from) => {
        const distances = spreadPoints.map((to) => p5.dist(to.x, to.y, from.x, from.y));
        const radiusIndex = distances.findIndex((distance, index) => distance <= radii[index]);
        if (radiusIndex !== -1) {
            insidePointsAt[radiusIndex].push({ column, row });
        } else {
            outsidePointsAt.push({ column, row });
        }
    });

    insidePointsAt.forEach((insidePointsAt, spreadPointIndex) => {
        // Sorts so that grid points most distant from the spread point go first.
        insidePointsAt.sort((position1, position2) => {
            const insidePoint1 = grid.get(position1.column, position1.row);
            const insidePoint2 = grid.get(position2.column, position2.row);
            const spreadPoint = spreadPoints[spreadPointIndex];
            const distance1 = p5.dist(spreadPoint.x, spreadPoint.y, insidePoint1.x, insidePoint1.y);
            const distance2 = p5.dist(spreadPoint.x, spreadPoint.y, insidePoint2.x, insidePoint2.y);
            return distance2 - distance1;
        });
        insidePointsAt.forEach(({ column, row }) => {
            const insidePoint = grid.get(column, row);
            const distancesToOutside = outsidePointsAt.map(({ column, row }) => {
                const outsidePoint = grid.get(column, row);
                return p5.dist(outsidePoint.x, outsidePoint.y, insidePoint.x, insidePoint.y);
            });
            const minToOutside = Math.min.apply(undefined, distancesToOutside);
            const spreadPoint = spreadPoints[spreadPointIndex];
            const toSpreadPoint = p5.dist(spreadPoint.x, spreadPoint.y, insidePoint.x, insidePoint.y);
            const radius = radii[spreadPointIndex];
            const index = distancesToOutside.indexOf(minToOutside);
            const closestOutside = grid.get(outsidePointsAt[index].column, outsidePointsAt[index].row);
            const toOutsidePoint = p5.createVector(closestOutside.x - spreadPoint.x, closestOutside.y - spreadPoint.y);
            // toOutsidePoint.setMag(toOutsidePoint.mag() / toSpreadPoint * 10)
            toOutsidePoint.setMag((toOutsidePoint.mag() / toSpreadPoint) * 10);
            const toInsidePoint = p5.createVector(insidePoint.x - spreadPoint.x, insidePoint.y - spreadPoint.y);
            toOutsidePoint.add(toInsidePoint);

            // Gradual spread
            // insidePoint.x = toOutsidePoint.x + spreadPoint.x
            // insidePoint.y = toOutsidePoint.y + spreadPoint.y
            // if (row > 0 && row < grid.height - 1) {
            //     const top = grid.get(column, row - 1)
            //     const bottom = grid.get(column, row + 1)
            //     insidePoint.y = Math.min(Math.max(top.y, insidePoint.y), bottom.y)
            // }
            // if (column > 0 && column < grid.width - 1) {
            //     const left = grid.get(column - 1, row)
            //     const right = grid.get(column + 1, row)
            //     insidePoint.x = Math.min(Math.max(left.x, insidePoint.x), right.x)
            // }

            // Full spread
            insidePoint.x = closestOutside.x;
            insidePoint.y = closestOutside.y;
        });
    });
}

/** Arches a grid around an origin, mutating the grid */
export function arcGrid(p5, grid, origin, arc = Math.PI) {
    const angleDelta = arc / grid[0].length;
    grid.forEachRow((cells, row) => {
        const centerIndex = Math.round(cells.length / 2);
        const centerValue = cells[centerIndex];
        const centerVector = p5.createVector(centerValue.x - origin.x, centerValue.y - origin.y);
        cells.forEach((value, index) => {
            const vector = centerVector.copy();
            vector.setHeading(vector.heading() + angleDelta * (index - centerIndex));
            vector.setMag(vector.mag() + centerValue.y - value.y);
            value.x = origin.x + vector.x;
            value.y = origin.y + vector.y;
        });
    });
}
