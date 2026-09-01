export function Array2D(width, height, initialize = () => {}) {
    this.values = Array(height)
        .fill()
        .map((value, row) =>
            Array(width)
                .fill()
                .map((value, column) => initialize(column, row)),
        );

    this.values.width = width;
    this.values.height = height;

    let cursor = 0;
    this.values.next = function () {
        if (cursor > width * height - 1) {
            throw 'Array2D cursor out of bounds';
        }
        const row = Math.floor(cursor / width);
        const column = cursor % width;
        cursor++;
        return { row, column, value: this[row]?.[column] };
    };

    /** Iterates over each value */
    this.values.traverse = function (predicate) {
        this.forEach.call(this, (columns, row) =>
            columns.forEach((value, column) => {
                predicate(column, row, value, this);
            }),
        );
    };

    /** Iterates over each row */
    this.values.forEachRow = this.values.forEach;

    /** Iterates over each column */
    this.values.forEachColumn = function (predicate) {
        for (let column = 0; column <= this.width - 1; column++) {
            const values = [];
            for (let row = 0; row <= this.height - 1; row++) {
                values.push(this[row][column]);
            }
            predicate(values, column);
        }
    };

    /** Iterates over the previous row values in the given column */
    this.values.forEachAbove = function (column, row, predicate) {
        for (let rowIndex = 0; rowIndex < row; rowIndex++) {
            const value = this[rowIndex][column];
            predicate(value, column, rowIndex);
        }
    };

    const originalAt = this.values.at;
    this.values.get = function (column, row) {
        if (row !== undefined) {
            return this[row]?.[column];
        } else {
            return originalAt.call(this, column);
        }
    };

    this.values.set = function (column, row, value) {
        this[row][column] = value;
    };

    this.values.getTransposed = function () {
        const values = this;
        return new Array2D(height, width, (column, row) => values.get(row, column));
    };

    this.values.isEmpty = function () {
        const values = this;
        return values.every((row) => row.every((element) => element === undefined));
    };

    return this.values;
}

Array2D.fromValues = function (values) {
    const height = values.length;
    const width = values[0].length;
    return new Array2D(width, height, (column, row) => values[row][column]);
};

Array2D.reflectBoth = function (array) {
    return new Array2D(array.width, array.height, (column, row) =>
        array.get(array.width - column - 1, array.height - row - 1),
    );
};

Array2D.reflectHorizontal = function (array) {
    return new Array2D(array.width, array.height, (column, row) => array.get(array.width - column - 1, row));
};

Array2D.reflectVertical = function (array) {
    return new Array2D(array.width, array.height, (column, row) => array.get(column, array.height - row - 1));
};

Array2D.sum = function (first, second, origin = { column: 0, row: 0 }) {
    return new Array2D(first.width, first.height, (column, row) => {
        const value1 = first.get(column, row) || 0;
        const value2 = second.get(column - origin.column, row - origin.row) || 0;
        return value1 + value2;
    });
};

Array2D.join = function (arrays = []) {
    const first = arrays[0];
    const rows = first.length;
    const values = [];
    for (let i = 0; i < rows; i++) {
        const rowItems = arrays.map((array) => array[i]);
        values.push(rowItems.flat());
    }
    return values;
};
