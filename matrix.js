/* global game */

// sign function
game.sign = function (n) {
    if (n > 0) {
        return 1;
    } else if (n < 0) {
        return -1;
    } else {
        return 0;
    }
};

// translate coordinates
game.translateCoordinate = function (coor) {
    var x = coor[0],
        y = coor[1];
    return [x + game.envs.origin.x, game.envs.origin.y - y];
};

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

// 2d matrix inverses

game.inverse_2d_mat = function (mat) {
    var det = game.det_for_pro_mat(mat);
    if (det === 0) {
        throw("The matrix is not invertible!");
    }

    return game.scalar_mat(1 / det,
                           [[mat[1][1]     , -1 * mat[0][1]],
                            [-1 * mat[1][0], mat[0][0]]]);
};

// matrix multiplication on a vector

game.mul_mat_on_vec = function (mat, vec) {
    return mat.map(function (e, i) {
        return game.dot_prod(e, vec);
    });
};

// matrix multiplication

// game.mul_mat = function (mat1, mat2) {
//     return mat1.map(function(e, i) {

//     });
// };


// vector operations

game.add_vec = function (v1, v2) {
    return v1.map(function (e, i) {
        return e + v2[i];
    });
};

game.sub_vec = function (v1, v2) {
    return v1.map(function (e, i) {
        return e - v2[i];
    });
};

game.scalar_vec = function (s, v) {
    return v.map(function (e) {
        return s * e;
    });
};

game.dot_prod = function (v1, v2) {
    var res = 0;

    for (var i = 0; i < v1.length; i++) {
        res += v1[i] * v2[i];
    }

    return res;
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

game.unit_vec = function (v) {
    return game.scalar_vec(1/game.len_vec(v), v);
};

game.unit_normal = function (v) {
    return game.unit_vec(game.normal_vec(v));
};

// find min_x, max_x, min_y, and max_y of an array of points

game.min_max_x_y = function (arr) {
    var min_x = 0,
        max_x = 0,
        min_y = 0,
        max_y = 0;

    for (var i = 0; i < arr.length; i++) {
        var ai  = arr[i],
            aix = ai[0],
            aiy = ai[1];
        if (aix < min_x) {
            min_x = aix;
        }
        if (aix > max_x) {
            max_x = aix;
        }
        if (aiy < min_y) {
            min_y = aiy;
        }
        if (aiy > max_y) {
            max_y = aiy;
        }
    }
    return [min_x, max_x, min_y, max_y];
};

// A special function that numbers the quadrants of a plane. It is like the following. The
// benefit of numbering this way is that to find the neighbouring quadrants one does
// bitwise xor with 1 or 2, which might be faster.

//            y
//            .
//     |      .   +--+
//     |      .   |  |
//     |      .   +--+
//            .
// ...........0............ x
//            .
//    ---+    .   ----+ 
//       |    .       | 
//    ---+    .   +---+ 
//       |    .   |    
//    ---+    .   +---- 
//            .

game.number_quadrant = function (point) {
    var x   = point[0],
        y   = point[1],
        res = 0;

    if (x * y === 0) {
        return undefined;
    }

    if (x < 0) {
        res += 1;
    }
    if (y < 0) {
        res += 2;
    }

    return res;
};

// antipodal map with respect to a set of vertices

game.antipodal_wrt_vertices = function (point, vertices) {
    var cx  = 0,
        cy  = 0,
        len = vertices.length,
        x   = point[0],
        y   = point[1];

    for (var i = 0; i < len; i++) {
        var vi = vertices[i];
        cx += vi[0];
        cy += vi[1];
    }

    cx /= len;
    cy /= len;

    return [2 * cx - x, 2 * cy - y];
};
