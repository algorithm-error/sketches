/** Returns an array of diagonal lines ("hatching") to fill a square. Smaller step yields denser hatching. */
export const getDiagonalHatching = ({ left, top, width, height }, step = 5, flip = false) => {
    const count = Math.round((width * 2) / step);
    const overrun = (count / 2) * step - width;
    const line = [];
    new Array(count).fill().forEach((element, index) => {
        if (index * step <= width) {
            line.push({ x: left + index * step, y: top }, { x: left, y: top + index * step });
        } else {
            line.push(
                { x: left + width, y: top + overrun + (index - count / 2) * step },
                { x: left + overrun + (index - count / 2) * step, y: top + height },
            );
        }
    });

    if (flip) {
        return line.map((p) => ({
            x: left + width - (p.x - left),
            y: p.y,
        }));
    }
    return line;
};

/** Returns an array of horizontal or vertical lines ("hatching") to fill a box. Smaller step yields denser hatching. If flip is true, returns horizontal lines instead. */
export const getHorizontalHatching = ({ left, top, width, height }, step = 5, flip = false) => {
    if (flip) {
        // Horizontal lines (parallel to width)
        const count = Math.ceil(height / step);
        const line = [];
        for (let i = 0; i <= count; i++) {
            line.push({ x: left, y: top + i * step }, { x: left + width, y: top + i * step });
        }
        return line;
    } else {
        // Vertical lines (parallel to height)
        const count = Math.ceil(width / step);
        const line = [];
        for (let i = 0; i <= count; i++) {
            line.push({ x: left + i * step, y: top }, { x: left + i * step, y: top + height });
        }
        return line;
    }
};
