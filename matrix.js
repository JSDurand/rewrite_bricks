/* global game */

// only provides two-dimensional operations


// matrix operations

// only for 3d-matrices: projectivisation of the two-dimensional space and we only
// consider 3d-matrices with the last row = [0, 0, 1]
game.det_for_pro_mat = function (mat) {
    return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];
};

game.scalar_mat = function (scalar, mat) {
    return mat.map(function (e, i) {
        return e.map(function (f, j) {
            return f * scalar;
        });
    });
};

game.inverse_pro_matrix = function (mat) {
    var det = game.det_for_pro_mat(mat);
    if (det === 0) {
        throw("The matrix is not invertible!");
    }

    return game.scalar_mat(1 / det,
                           [[mat[1][1]     , -1 * mat[0][1], mat[0][1] * mat[1][2] - mat[1][1] * mat[0][2]],
                            [-1 * mat[1][0], mat[0][0]     , mat[1][0] * mat[0][2] - mat[0][0] * mat[1][2]],
                            [0             , 0             , 1]]);
};

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

game.unit_normal = function (v) {
    return game.scalar_vec(1/game.len_vec(v), game.normal_vec(v));
};
