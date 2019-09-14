/* global game stroke fill line ellipse performance */

// This file deals with the Minkowski sum computation via Gauss map

// First we want to extract the image under the Gauss map of the rectangles. To do this we
// need a representation of the image; since we are dealing exclusively with rectangles,
// we represent the image of a rectangle under the Gauss map as an array of four pairs,
// each consisting of a point and one of the original edges.

game.gauss = {};

// The function computes the normal vector of an edge.
game.gauss.compute_normal = function (edge) {
    return game.unit_normal(game.sub_vec(edge[1], edge[0]));
};

// This function takes each edge and computes its normal, and then pair the two.
game.gauss.map = function (rectangle) {
    var vertices = rectangle.vertices();

    var edges = vertices.map(function (e, i) {
        return [e, vertices[(i+1) % vertices.length]];
    });

    return edges.map(function (e, i) {
        return {
            original_edge: e,
            vec: game.gauss.compute_normal(e)
        };
    });
};

// Instead of producing the boundary of the Minkowski sum, we shall give the equations of
// the boundaries of the Minkowski sum; for the sake of testing, we shall first give the
// boundaries of the Minkowski sum as well, but this is not used elsewhere, and might be
// deleted later on.
game.minkowski = function (rec1, rec2) {
    // var p0   = performance.now();
    var ver1 = rec1.vertices,
        ver2 = rec2.vertices;

    var c1x = rec1.c_x(),
        c1y = rec1.c_y(),
        c2x = rec2.c_x(),
        c2y = rec2.c_y();
    
    // extract edges
    var edge1 = ver1.map(function (e, i) {
        return [e, ver1[(i+1) % ver1.length]];
        }),
        edge2 = ver2.map(function (e, i) {
        return [e, ver2[(i+1) % ver2.length]];
        });

    // Transform the basis so that rec1 is axis-aligned and centered at the origin. Take
    // the first two edges as the (orthogonal) basis
    var basis_first  = game.unit_vec(game.sub_vec(edge1[0][1],edge1[0][0])),
        basis_second = game.unit_vec(game.sub_vec(edge1[1][1], edge1[1][0])),
        basis        = [[basis_first[0], basis_second[0]],
                        [basis_first[1], basis_second[1]]];

    var inverse_transform_matrix = game.inverse_2d_mat(basis);

    var transformed_ver1 = ver1.map(function (e) {
        return game.mul_mat_on_vec(inverse_transform_matrix,
                                   game.sub_vec(e, [c1x, c1y]));
        }),
        transformed_ver2 = ver2.map(function (e) {
            return game.mul_mat_on_vec(inverse_transform_matrix,
                                       game.sub_vec(e, [c1x, c1y]));
        });

    // transformed center of the second rectangle
    var transformed_c2 = game.mul_mat_on_vec(inverse_transform_matrix,
                                             game.sub_vec([c2x, c2y], [c1x, c1y]));

    var transformed_edge1 = transformed_ver1.map(function (e, i) {
        return [e, transformed_ver1[(i+1) % transformed_ver1.length]];
        }),
        transformed_edge2 = transformed_ver2.map(function (e, i) {
        return [e, transformed_ver2[(i+1) % transformed_ver2.length]];
        });

    // Now rec1 is axis-aligned and centered at the origin.
    // Take the unit normals of rec2.

    var unit_normal_vectors =
        [game.unit_normal(game.sub_vec(transformed_edge2[0][1], transformed_edge2[0][0])),
         game.unit_normal(game.sub_vec(transformed_edge2[1][1], transformed_edge2[1][0]))];

    var pairs                = [],
        antipodal_pairs      = [],
        dual_pairs           = [],
        dual_antipodal_pairs = [];

    for (var i = 0; i < unit_normal_vectors.length; i++) {
        var number_of_quadrant = game.number_quadrant(unit_normal_vectors[i]),
            corrsponding_point = game.find_corresponding_point(number_of_quadrant);

        pairs[i] = [number_of_quadrant, corrsponding_point, i];
    }

    // antipodal pairs
    for (var j = 0; j < pairs.length; j++) {
        var pj = pairs[j];

        antipodal_pairs[j] = [
            // xor with 3 to obtain the antipodal quadrant
            pj[0] ^ 3,
            (pj[1] + 2) % ver1.length,
            (pj[2] + 2) % edge2.length
        ];
    }

    // dual pairs
    var first_pair     = pairs[0],
        neighbour      = null,
        neighbour_edge = null,
        new_edge       = null,
        common_point   = null;
 
    for (var k = 0; k < 2; k++) {
        // find a neighbouring arc
        neighbour      = (((first_pair[1] + (k << 1) -1) % ver1.length) + ver1.length) % ver1.length;
 
        // find the previously found matching point 
        neighbour_edge = [].concat(pairs, antipodal_pairs).find(function (e) {
            return e[1] === neighbour;
        })[2];

        if ((neighbour_edge === 0 && first_pair[2] === 3) ||
            (neighbour_edge === 3 && first_pair[2] === 0)) {
            common_point = 0;
        } else {
            common_point = Math.max(neighbour_edge, first_pair[2]);
        }

        if (k === 0) {
            new_edge = neighbour;
        } else {
            new_edge = first_pair[1];
        }
        dual_pairs[k] = [
            neighbour,
            new_edge,
            common_point
        ];
    }

    // dual antipodal pairs
    for (var l = 0; l < dual_pairs.length; l++) {
        var pl             = dual_pairs[l];

        dual_antipodal_pairs[l] = [
            // xor with 3 to obtain the antipodal quadrant
            pl[0] ^ 3,
            (pl[1] + 2) % edge1.length,
            (pl[2] + 2) % ver2.length,
        ];
    }

    var total_pairs = [].concat(pairs, antipodal_pairs, dual_pairs, dual_antipodal_pairs);

    for (var alpha = 0; alpha < total_pairs.length; alpha++) {
        var pi    = total_pairs[alpha],
            point = null,
            edge  = null,
            begin = [],
            end   = [];

        if (alpha >= 4) { // the first four are pairs and antipodal pairs
            stroke("green");
            edge  = edge1[pi[1]];
            point = ver2[pi[2]];
        } else {
            stroke("yellow");
            point = ver1[pi[1]];
            edge  = edge2[pi[2]];
        }

        begin = game.translateCoordinate(game.add_vec(point, edge[0]));
        end   = game.translateCoordinate(game.add_vec(point, edge[1]));

        ellipse(begin[0], begin[1], 5, 5);
        ellipse(end[0], end[1], 5, 5);
        line(begin[0], begin[1], end[0], end[1]);
    }
    
    // var p2 = performance.now();

    // console.log("1-2: " + (p2-p0));
    return total_pairs;
};

// find the corresponding point according to the quadrant
game.find_corresponding_point = function (number_of_quadrant) {
    var corrsponding_point = null;

    switch (number_of_quadrant) {
    case 0:
        corrsponding_point = 2;
        break;
    case 1:
        corrsponding_point = 3;
        break;
    case 2:
        corrsponding_point = 1;
        break;
    case 3:
        corrsponding_point = 0;
        break;
    default:
        throw("find_corresponding_point: Number of quadrant should be between 0 and 3, but it is " + number_of_quadrant);
        break;
    };
    return corrsponding_point;
};


// archive

// if (typeof(pi[1]) == "number") {
//     point = game.add_vec(game.mul_mat_on_vec(basis, pi[2]), [c1x, c1y]);
//     edge  = edge1[pi[1]];
//     begin = game.translateCoordinate(game.add_vec(edge[0], point));
//     end   = game.translateCoordinate(game.add_vec(edge[1], point));

// begin = game.translateCoordinate(game.add_vec(
//     game.mul_mat_on_vec(basis, begin),
//     [c1x, c1y]));
// end   = game.translateCoordinate(game.add_vec(
//     game.mul_mat_on_vec(basis, end),
//     [c1x, c1y]));
// } else {
//     point = game.add_vec(game.mul_mat_on_vec(basis, pi[1]), [c1x, c1y]);
//     edge  = edge2[pi[2]];

//     begin = game.translateCoordinate(game.add_vec(edge[0], point));
//     end   = game.translateCoordinate(game.add_vec(edge[1], point));
// begin = game.translateCoordinate(game.add_vec(
//     game.mul_mat_on_vec(basis, begin),
//     [c1x, c1y]));
// end   = game.translateCoordinate(game.add_vec(
//     game.mul_mat_on_vec(basis, end),
//     [c1x, c1y]));
// }

// stroke("green");
// fill("green");
