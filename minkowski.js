/* global game */

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
    var p0   = performance.now();
    var ver1 = rec1.vertices,
        ver2 = rec2.vertices;

    var c1x = rec1.c_x(),
        c1y = rec1.c_y();
    
    // extract edges
    var edge1 = ver1.map(function (e, i) {
        return [e, ver1[(i+1) % ver1.length]];
        }),
        edge2 = ver2.map(function (e, i) {
        return [e, ver2[(i+1) % ver2.length]];
        });

    // Transform the basis so that rec1 is axis-aligned and centered at the origin. Take
    // the first two edges as the (orthogonal) basis
    var basis = [game.unit_vec(game.sub_vec(edge1[0][1],edge1[0][0])),
                 game.unit_vec(game.sub_vec(edge1[1][1], edge1[1][0]))];

    var inverse_transform_matrix = game.inverse_2d_mat(basis);

    var transformed_ver1 = ver1.map(function (e) {
        return game.sub_vec(game.mul_mat_on_vec(inverse_transform_matrix, e),
                            [c1x, c1y]);
        }),
        transformed_ver2 = ver2.map(function (e) {
        return game.sub_vec(game.mul_mat_on_vec(inverse_transform_matrix, e),
                            [c1x, c1y]);
        });

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

    // determine the signs
    var two_pairs = unit_normal_vectors.map(function (e) {
        return e.map(game.sign);
    });

    var antipodal_pairs = game.scalar_mat(-1, two_pairs);
    var p2 = performance.now();

    console.log("1-2: " + (p2-p0));
    return antipodal_pairs;
};
