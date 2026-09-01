export const hex2rgb = (rawHex = '') => {
    const hex = rawHex.replace('#', '');
    if (hex.length !== 6) return [0, 0, 0];
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
};

export const luminance = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
