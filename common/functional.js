export const debounce = (callback, wait, immediate) => {
    let timeout;
    // Make sure to not to return arrow function here. Otherwise, the arguments will contain unexpected value.
    return function () {
        let args = arguments,
            context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = null;
            if (!immediate) callback.apply(context, args);
        }, wait);
        if (immediate && !timeout) callback.apply(context, args);
    };
};
