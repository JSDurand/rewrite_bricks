/* global game performance findRoots */

// detect the collision between polygons

game.collision = {};

game.collision.point_on_edge = (p, v1, v2) => {
    if (v1[0] === v2[0] && v1[1] === v2[1]) {
        return false;
    }
    var ind = game.det_for_vec(game.sub_vec(p, v1), game.sub_vec(v2, v1)) === 0;

    return ind;
};

game.collision.point_edge_side = (p, v1, v2) => {
    var rel_p  = game.sub_vec(p, v1),
        normal = game.normal_vec(game.sub_vec(v2, v1)),
        ind    = game.dot_prod(rel_p, normal);

    if (ind > 0) {
        return 1;
    } else if (ind < 0) {
        return -1;
    } else {
        return 0;
    }
};

game.collision.two_edges = (ea, eb) => {

    // extract vertices
    var v1 = ea[0],
        v2 = ea[1],
        v3 = eb[0],
        v4 = eb[1];

    // determine if a vertice lies on an edge
    var ind_on_edge1 = game.collision.point_on_edge(v1, v3, v4),
        ind_on_edge2 = game.collision.point_on_edge(v2, v3, v4),
        ind_on_edge3 = game.collision.point_on_edge(v3, v1, v2),
        ind_on_edge4 = game.collision.point_on_edge(v4, v1, v2);

    if (ind_on_edge1) {
        return v1;
    } else if (ind_on_edge2) {
        return v2;
    } else if (ind_on_edge3) {
        return v3;
    } else if (ind_on_edge4) {
        return v4;
    }

    // v1 and v2 should lie on different sides of the edge 3-4 and similarly for the dual
    var ind_on_side1 = game.collision.point_edge_side(v1, v3, v4),
        ind_on_side2 = game.collision.point_edge_side(v2, v3, v4),
        ind_on_side3 = game.collision.point_edge_side(v3, v1, v2),
        ind_on_side4 = game.collision.point_edge_side(v4, v1, v2);

    if (ind_on_side1 * ind_on_side2 < 0 && ind_on_side3 * ind_on_side4 < 0) {
        return true;
    } else {
        return false;
    }
};

game.collision.statics = (obja, objb) => {
    // The type of an object is either 0 or 1; 0 means rectangle and 1 means circle.
    var type_sig = obja.type + (objb.type << 1);

    switch (type_sig) {
    case 0:
        // both are rectangles

        var gjk = game.gjk(obja, objb);

        return gjk.intersecting;
        
        break;
    case 1:
        // a is rectangle and b is circle
        break;
    case 2:
        // b is rectangle and a is circle
        break;
    case 3:
        // both are circles
        break;
    default:
        console.log("Wrong type signature: it should be 0, 1, 2, or 3, but it is " + type_sig);
        break;
    }
};

game.collision.continuous = function (obja, objb) {
    // var p0   = performance.now();
    // The type of an object is either 0 or 1; 0 means rectangle and 1 means circle.
    var type_sig = obja.type + (objb.type << 1),
        epsilon  = 1;

    switch (type_sig) {
    case 0:
        // both are rectangles

        // take vertices
        var ver1 = obja.vertices,
            ver2 = objb.vertices;

        // transform to edges
        var edge1 = ver1.map((e, i) => {
            return [e, ver1[(i+1) % ver1.length]];
        }),
            edge2 = ver2.map((e, i) => {
            return [e, ver2[(i+1) % ver2.length]];
        });

        // First we do a simple bounding sphere test.

        // centers
        var c1 = [obja.c_x(), obja.c_y()],
            c2 = [objb.c_x(), objb.c_y()];

        // velocities
        var v1 = [obja.vx, obja.vy],
            v2 = [objb.vx, objb.vy],
            w1 = obja.w,
            w2 = objb.w;

        // radius
        var r1 = game.len_vec(game.sub_vec(ver1[0], c1)),
            r2 = game.len_vec(game.sub_vec(ver2[0], c2));

        // bounding sphere test
        if (game.len_vec(game.sub_vec(c1, c2)) > r1 + r2 + game.len_vec(game.sub_vec(v1, v2))) {
            return false;
        }

        // calculate excluding points
        // var exclude_point1 = null,
        //     exclude_point2 = null,
        //     relative_c     = game.sub_vec(c2, c1),
        //     relative_v     = game.sub_vec(v2, v1),
        //     discriminant   = Math.pow(game.dot_prod(relative_c, relative_v), 2) - game.sq_len_vec(relative_v) * (game.sq_len_vec(relative_c) - Math.pow(r1 + r2, 2));

        // if (discriminant < 0) {
        //     return false;
        // } else {
        //     exclude_point1 = (-1 * game.dot_prod(relative_c, relative_v) - Math.sqrt(discriminant)) / game.sq_len_vec(relative_v); 
        //     exclude_point2 = (-1 * game.dot_prod(relative_c, relative_v) + Math.sqrt(discriminant)) / game.sq_len_vec(relative_v); 
        // }

        
        // var p2 = performance.now();
        // return p2-p0;
        // return "t: " + ((m * 90 - angle) / (w2 - w1));
        return false;
        
        break;
    case 1:
        // a is rectangle and b is circle
        break;
    case 2:
        // b is rectangle and a is circle
        break;
    case 3:
        // both are circles
        break;
    default:
        console.log("Wrong type signature: it should be 0, 1, 2, or 3, but it is " + type_sig);
        break;
    }
};

game.step_time = function (rec, t) {
    if (t === 0) {
        return rec;
    }

    var stepped_rec   = null;

    var vx            = rec.vx,
        vy            = rec.vy,
        w             = rec.w * Math.PI / 180,
        cx            = rec.c_x(),
        cy            = rec.c_y();

    var cos           = Math.cos(w * t),
        sin           = Math.sin(w * t),
        vxt           = vx * t,
        vyt           = vy * t;

    var motion_matrix = [[cos, -1 * sin, -1 * cos * cx + sin * cy + cx + vxt],
                         [sin, cos     , -1 * sin * cx - cos * cy + cy + vyt],
                         [0  , 0       , 1]];

    stepped_rec = game.apply_matrix(motion_matrix, rec);

    return stepped_rec;
};

game.apply_matrix = function (matrix, rec) {
    var vertices = rec.vertices,
        new_rec  = game.clone(rec),
        new_vec  = [];

    for (var i = 0; i < vertices.length; i++) {
        new_vec[i] = game.mul_mat_on_vec(matrix, [].concat(vertices[i], [1])).slice(0, 2);
    }

    new_rec["vertices"] = new_vec;

    return new_rec;
};

// transform the coordinates so that rec1 is axis-aligned and centered at the origin.
game.transform_Coord = function (rec1, rec2) {

    // take vertices
    var ver1 = rec1.vertices,
        ver2 = rec2.vertices;

    // transform to edges
    var edge1 = ver1.map((e, i) => {
        return [e, ver1[(i+1) % ver1.length]];
    }),
        edge2 = ver2.map((e, i) => {
            return [e, ver2[(i+1) % ver2.length]];
        });

    // centers
    var c1 = [rec1.c_x(), rec1.c_y()],
        c2 = [rec2.c_x(), rec2.c_y()];

    // Transform the basis so that rec1 is axis-aligned and centered at the origin. Take
    // the first two edges as the (orthogonal) basis
    var basis_first  = game.unit_vec(game.sub_vec(edge1[0][1],edge1[0][0])),
        basis_second = game.unit_vec(game.sub_vec(edge1[1][1], edge1[1][0])),
        // Here a transpose is needed, else the order of multiplication should be changed.
        basis        = [[basis_first[0], basis_second[0]],
                        [basis_first[1], basis_second[1]]];

    var inverse_transform_matrix = game.inverse_2d_mat(basis);

    var transformed_ver1 = ver1.map(function (e) {
        return game.mul_mat_on_vec(inverse_transform_matrix,
                                   game.sub_vec(e, [c1[0], c1[1]]));
    }),
        transformed_ver2 = ver2.map(function (e) {
            return game.mul_mat_on_vec(inverse_transform_matrix,
                                       game.sub_vec(e, [c1[0], c1[1]]));
        });

    // transformed edges
    var transformed_edge1 = transformed_ver1.map(function (e, i) {
        return [e, transformed_ver1[(i+1) % transformed_ver1.length]];
    }),
        transformed_edge2 = transformed_ver2.map(function (e, i) {
            return [e, transformed_ver2[(i+1) % transformed_ver2.length]];
        });

    // transformed center of the second rectangle
    var transformed_c2 = game.mul_mat_on_vec(inverse_transform_matrix,
                                             game.sub_vec([c2[0], c2[1]], [c1[0], c1[1]]));

    // Now rec1 is axis-aligned and centered at the origin.
    // Take the normals of rec2.

    var normal_vectors =
        [game.normal_vec(game.sub_vec(transformed_edge2[0][1], transformed_edge2[0][0])),
         game.normal_vec(game.sub_vec(transformed_edge2[1][1], transformed_edge2[1][0]))];

    return {
        ver1: transformed_ver1,
        ver2: transformed_ver2,
        edge1: transformed_edge1,
        edge2: transformed_edge2,
        basis: basis,
        inverse_transform_matrix: inverse_transform_matrix,
        center: transformed_c2,
        normals: normal_vectors,
    };
};

game.collision.continuous_parallel = function (obja, objb) {
    // TODO: consider the case pair12 / 21 is undefined, when the rectangles are not
    // rotating, or rotating at the same angular velocity, and are parallel.


    return undefined;
};

// trim the trailing zeroes
game.trim_last_zeroes = function (arr) {
    var result = [...arr];

    while(result[result.length - 1] === 0) {
        result.pop();
    }

    return result;
};
