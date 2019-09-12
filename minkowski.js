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

};
