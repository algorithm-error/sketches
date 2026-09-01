export function getAdjacentPolygonUnion(poly1, poly2) {
    let result = [];
    let visited1 = new Array(poly1.length).fill(false);
    let visited2 = new Array(poly2.length).fill(false);

    let start = findUncommonPoint(poly1, poly2);
    if (start === -1) return null; // Polygons are identical

    let current = poly1[start];
    let currentPoly = 1;
    let currentIndex = start;

    while (result.length === 0 || !pointEquals(current, result[0])) {
        result.push(current);

        if (currentPoly === 1) {
            visited1[currentIndex] = true;
        } else {
            visited2[currentIndex] = true;
        }

        let nextIndex = (currentIndex + 1) % (currentPoly === 1 ? poly1.length : poly2.length);
        let next = currentPoly === 1 ? poly1[nextIndex] : poly2[nextIndex];

        let switchIndex = findPointInOtherPoly(next, currentPoly === 1 ? poly2 : poly1);

        if (switchIndex !== -1 && !isVisited(switchIndex, currentPoly === 1 ? visited2 : visited1)) {
            currentPoly = currentPoly === 1 ? 2 : 1;
            currentIndex = switchIndex;
        } else {
            currentIndex = nextIndex;
        }

        current = currentPoly === 1 ? poly1[currentIndex] : poly2[currentIndex];
    }

    return result;
}

function findUncommonPoint(poly1, poly2) {
    for (let i = 0; i < poly1.length; i++) {
        if (!poly2.some((p) => pointEquals(p, poly1[i]))) {
            return i;
        }
    }
    return -1;
}

function findPointInOtherPoly(point, poly) {
    return poly.findIndex((p) => pointEquals(p, point));
}

function isVisited(index, visitedArray) {
    return visitedArray[index];
}

function pointEquals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}
