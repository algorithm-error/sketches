const laplacian = [
    [0.05, 0.2, 0.05],
    [0.2, -1, 0.2],
    [0.05, 0.2, 0.05],
];

export function convolveMatrix(matrix, kernel = laplacian) {
    if (kernel.length === 0 || kernel[0].length === 0 || matrix.length === 0 || matrix[0].length === 0) {
        return matrix;
    }
    const imageWidth = matrix[0].length;
    const imageHeight = matrix.length;
    const result = new Array(imageHeight - 2).fill(0).map(() => new Array(imageWidth - 2).fill(0));

    for (let y = 1; y < imageHeight - 1; y++) {
        for (let x = 1; x < imageWidth - 1; x++) {
            result[y - 1][x - 1] = convolveCell(matrix, x, y, kernel);
        }
    }

    return result;
}

export function convolveCell(matrix, x, y, kernel, product = (value, ratio) => value * ratio) {
    const kernelWidth = kernel[0].length;
    const kernelHeight = kernel.length;
    let sum = 0;
    for (let ky = 0; ky < kernelHeight; ky++) {
        for (let kx = 0; kx < kernelWidth; kx++) {
            sum += product(matrix[x + kx - 1][y + ky - 1], kernel[ky][kx]);
        }
    }
    return sum;
}
