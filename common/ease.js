export const LINEAR_EASE = 0;
export const QUADRATIC_EASE = 1;
export const CUBIC_EASE = 2;
export const SQRT_EASE = 8;

// When the easing is applied (start, end, or both)
export const IN = 0;
export const OUT = 1;
export const BOTH = 2;

// Works a lot like map() but allows for easing
export function ease(value, start1, stop1, start2, stop2, type, when) {
    let b = start2;
    let c = stop2 - start2;
    let t = value - start1;
    let d = stop1 - start1;
    let p = 0.5;

    switch (type) {
        case LINEAR_EASE:
            return (c * t) / d + b;

        case SQRT_EASE:
            if (when === IN) {
                t /= d;
                return c * Math.pow(t, p) + b;
            } else if (when === OUT) {
                t /= d;
                return c * (1 - Math.pow(1 - t, p)) + b;
            } else if (when === BOTH) {
                t /= d / 2;
                if (t < 1) return (c / 2) * Math.pow(t, p) + b;
                return (c / 2) * (2 - Math.pow(2 - t, p)) + b;
            }
            break;

        case QUADRATIC_EASE:
            if (when === IN) {
                t /= d;
                return c * t * t + b;
            } else if (when === OUT) {
                t /= d;
                return -c * t * (t - 2) + b;
            } else if (when === BOTH) {
                t /= d / 2;
                if (t < 1) return (c / 2) * t * t + b;
                t--;
                return (-c / 2) * (t * (t - 2) - 1) + b;
            }
            break;

        case CUBIC_EASE:
            if (when === IN) {
                t /= d;
                return c * t * t * t + b;
            } else if (when === OUT) {
                t /= d;
                t--;
                return c * (t * t * t + 1) + b;
            } else if (when === BOTH) {
                t /= d / 2;
                if (t < 1) return (c / 2) * t * t * t + b;
                t -= 2;
                return (c / 2) * (t * t * t + 2) + b;
            }
            break;
    }

    return 0;
}
