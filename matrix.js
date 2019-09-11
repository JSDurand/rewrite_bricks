/* global game */

// only provides two-dimensional operations


// matrix operations

// vector operations

game.add_vec = function (v1, v2) {
    return [v1[0]+v2[0], v1[1]+v2[1]];
};

game.sub_vec = function (v1, v2) {
    return [v1[0]-v2[0], v1[1]-v2[1]];
};

game.scalar_vec = function (s, v) {
    return [s*v[0], s*v[1]];
};

game.dot_prod = function (v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1];
};

game.det_for_vec = function (v1, v2) {
    return v1[0] * v2[1] - v1[1] * v2[0];
};

game.len_vec = function (v) {
    return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
};

game.normal_vec = function (v) {
    return [v[1], -1 * v[0]];
};
