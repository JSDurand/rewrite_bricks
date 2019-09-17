/* global game stroke fill line ellipse performance */

// This file deals with the Minkowski sum computation via Gauss map

// We shall give the boundaries of the Minkowski sum in order to determine the equations
// of the boundaries of the Minkowski sum.
game.minkowski = function (rec1, rec2) {
    var p0   = performance.now();
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
        // Here a transpose is needed, else the order of multiplication should be changed.
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

    // transformed edges
    var transformed_edge1 = transformed_ver1.map(function (e, i) {
        return [e, transformed_ver1[(i+1) % transformed_ver1.length]];
        }),
        transformed_edge2 = transformed_ver2.map(function (e, i) {
        return [e, transformed_ver2[(i+1) % transformed_ver2.length]];
        });

    // transformed center of the second rectangle
    var transformed_c2 = game.mul_mat_on_vec(inverse_transform_matrix,
                                             game.sub_vec([c2x, c2y], [c1x, c1y]));

    // Now rec1 is axis-aligned and centered at the origin.
    // Take the normals of rec2.

    var normal_vectors =
        [game.normal_vec(game.sub_vec(transformed_edge2[0][1], transformed_edge2[0][0])),
         game.normal_vec(game.sub_vec(transformed_edge2[1][1], transformed_edge2[1][0]))];

    // to find the pairs is divided into four steps
    var pairs                = [],
        antipodal_pairs      = [],
        dual_pairs           = [],
        dual_antipodal_pairs = [];

    // This is the only part which deals with the vector operations: taking normals; the
    // rest consists of simple logics and symbol manipulations.
    for (var i = 0; i < normal_vectors.length; i++) {
        var number_of_quadrant = game.number_quadrant(normal_vectors[i]),
            corrsponding_point = game.find_corresponding_point(number_of_quadrant);

        // If the rectangles are parallel, then return undefined so that later we might
        // identify this situation and handle these cases separately. Notice that in
        // theory this situation should not occur, since we exclude at the beginning this
        // situaiton by dividing [0, 1] into subintervals. But in practice this will still
        // happen as we also have to consider the case that the rectangles are not
        // rotating, in which case it can be the case that the rectangles are parallel and
        // there is no interval division to avoid this situation.
        if (typeof(corrsponding_point) === "undefined") {
            return undefined;
        }
        
        pairs[i] = [corrsponding_point, i];

        // antipodal pairs: since we number the vertices and edges continuously, to find the
        // antipodal vertex / edge is just to add 2 modulo the length of vertices / edges.
        // Here 2 is half the length. Maybe I shall fix this magic number in the future.

        antipodal_pairs[i] = [
            (corrsponding_point + 2) % ver1.length,
            (i + 2) % edge2.length
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
        neighbour = (((first_pair[0] + (k << 1) -1) % ver1.length) + ver1.length) % ver1.length;
 
        // find the previously found matching point 
        neighbour_edge = [].concat(pairs, antipodal_pairs).find(function (e) {
            return e[0] === neighbour;
        })[1];

        if ((neighbour_edge === 0 && first_pair[1] === 3) ||
            (neighbour_edge === 3 && first_pair[1] === 0)) {
            common_point = 0;
        } else {
            common_point = Math.max(neighbour_edge, first_pair[1]);
        }

        if (k === 0) {
            new_edge = neighbour;
        } else {
            new_edge = first_pair[0];
        }
        dual_pairs[k] = [
            new_edge,
            common_point
        ];

        // dual antipodal pairs

        dual_antipodal_pairs[k] = [
            (new_edge + 2) % edge1.length,
            (common_point + 2) % ver2.length,
        ];
    }

    var total_pairs = [].concat(pairs, antipodal_pairs, dual_pairs, dual_antipodal_pairs);

    // Below is for drawing the Minkowski sum, in order to see if the algorithm is
    // correct. After tests it serves no purposes.
    // for (var alpha = 0; alpha < total_pairs.length; alpha++) {
    //     var pi    = total_pairs[alpha],
    //         point = null,
    //         edge  = null,
    //         begin = [],
    //         end   = [];

    //     if (alpha >= 4) { // the first four are pairs and antipodal pairs
    //         stroke("green");
    //         edge  = edge1[pi[0]];
    //         point = ver2[pi[1]];
    //     } else {
    //         stroke("yellow");
    //         point = ver1[pi[0]];
    //         edge  = edge2[pi[1]];
    //     }

    //     begin = game.translateCoordinate(game.add_vec(point, edge[0]));
    //     end   = game.translateCoordinate(game.add_vec(point, edge[1]));

    //     ellipse(begin[0], begin[1], 5, 5);
    //     ellipse(end[0], end[1], 5, 5);
    //     line(begin[0], begin[1], end[0], end[1]);
    // }
    
    var p2 = performance.now();

    // console.log("1-2: " + (p2-p0));
    return p2-p0;
    // return total_pairs;
};

// Find the corresponding point according to the quadrant. This can also be written as an
// expression (x) => { return (x - ((x >> 1) << 1) + 2) ^ (3 * (x >> 1)); }. But it is not
// better at all.
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
        corrsponding_point = undefined;
        // throw("find_corresponding_point: Number of quadrant should be between 0 and 3, but it is " + number_of_quadrant);
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

// for (var j = 0; j < pairs.length; j++) {
//     var pj = pairs[j];

//     antipodal_pairs[j] = [
//         // xor with 3 to obtain the antipodal quadrant
//         // pj[0] ^ 3,
//         (pj[0] + 2) % ver1.length,
//         (pj[1] + 2) % edge2.length
//     ];
// }

// for (var l = 0; l < dual_pairs.length; l++) {
//     var pl = dual_pairs[l];

//     dual_antipodal_pairs[l] = [
//         // xor with 3 to obtain the antipodal quadrant
//         // pl[0] ^ 3,
//         (pl[0] + 2) % edge1.length,
//         (pl[1] + 2) % ver2.length,
//     ];
// }

// First we want to extract the image under the Gauss map of the rectangles. To do this we
// need a representation of the image; since we are dealing exclusively with rectangles,
// we represent the image of a rectangle under the Gauss map as an array of four pairs,
// each consisting of a point and one of the original edges.

// game.gauss = {};

// The function computes the normal vector of an edge.
// game.gauss.compute_normal = function (edge) {
//     return game.unit_normal(game.sub_vec(edge[1], edge[0]));
// };

// This function takes each edge and computes its normal, and then pair the two.
// game.gauss.map = function (rectangle) {
//     var vertices = rectangle.vertices();

//     var edges = vertices.map(function (e, i) {
//         return [e, vertices[(i+1) % vertices.length]];
//     });

//     return edges.map(function (e, i) {
//         return {
//             original_edge: e,
//             vec: game.gauss.compute_normal(e)
//         };
//     });
// };
