/* global game */

// the function for finding roots of a separation function

// the maximum number of iterations to run before it has to return
game.iteration_max = 10;
game.epsilon       = 0.001;

game.find_root = function (func, start=0, end=1) {
    // First assure the function changes signs.
    if (func(start) * func(end) > game.epsilon) {
        debugger;
        console.log(func(start));
        console.log(func(end));
        throw("root-finding: The function does not change sign from " + start + " to " + end);
    }

    var new_pair = {};

    for (var iteration_number = 0; iteration_number < game.iteration_max; iteration_number++) {
        if (iteration_number % 2 === 0) {
            new_pair = game.bisection_step(func, start, end);
            start    = new_pair.start;
            end      = new_pair.end;

            if ((end - start) < game.epsilon) {
                return (start + end) / 2;
            }
        } else {
            new_pair = game.secant_step(func, start, end);
            start    = new_pair.start;
            end      = new_pair.end;

            if ((end - start) < game.epsilon) {
                return (start + end) / 2;
            }
        }
    }

    return (start + end) / 2;
};

game.bisection_step = function (func, start=0, end=1) {
    if (Math.abs(func(start)) < game.epsilon) {
        return {start: start,
                end  : start};
    }

    if (Math.abs(func(end)) < game.epsilon) {
        return {start: end,
                end  : end};
    }

    // First assure the function changes signs.
    if (func(start) * func(end) > 0) {
        throw("The function does not change sign from " + start + " to " + end);
    }

    var result = {},
        temp   = (start + end) / 2;

    if (Math.abs(func(temp)) < game.epsilon) {
        // when temp is a root
        result.start = temp;
        result.end   = temp;
    } else if (func(start) * func(temp) < 0) {
        result.start = start;
        result.end   = temp;
    } else {
        result.start = temp;
        result.end   = end;
    }

    return result;
};

game.secant_step = function (func, start=0, end=1) {
    var fs = func(start),
        fe = func(end);
    
    if (Math.abs(fs) < game.epsilon) {
        return {start: start,
                end  : start};
    }

    if (Math.abs(fe) < game.epsilon) {
        return {start: end,
                end  : end};
    }

    // First assure the function changes signs.
    if (fs * fe > 0) {
        throw("The function does not change sign from " + start + " to " + end);
    }

    var result = {},
        temp   = start - (fs * (end - start)) / (fe - fs),
        ft     = func(temp);

    if (Math.abs(ft) < game.epsilon) {
        // when temp is a root
        result.start = temp;
        result.end   = temp;
    } else if (fs * ft < 0) {
        result.start = start;
        result.end   = temp;
    } else {
        result.start = temp;
        result.end   = end;
    }

    return result;
};
