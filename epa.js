/* global game */

// Expanding Polytope Algorithm

// In the simulations I find that the contact informations seem to be wrong: often times
// the objects collide and do some bizarre behaviours. So I consider the expanding
// polytope algorithm a remedy for this situation.

// We fed the termination simplex from GJK algorithm to EPA as the initial simplex.
game.epa = function (rec1, rec2, initial_simplex) {
    var simplex  = initial_simplex,
        support  = undefined,
        edge     = undefined,
        distance = undefined,
        result   = {},
        count    = 0;

    for (count = 0; count < 20; count++) {
        // if (typeof(simplex) === "undefined" || isNaN(simplex[0].point[0])) {
        //     debugger;
        // }
        edge     = game.closest_edge(rec1, rec2, simplex);
        support  = game.support_in_minkowski_difference(rec1, rec2, edge.normal);
        distance = game.dot_prod(support.point, edge.normal);

        if (distance - edge.distance < 0.1) {
            break;
        } else {
            simplex.splice(edge.index + 1, 0, support);
        }
    }

    result = {
        normal: edge.normal,
        distance: distance,
    };

    return result;
};

// Find the closest edge of a simplex
game.closest_edge = function (rec1, rec2, simplex) {
    var distance    = undefined,
        verticesa   = rec1.vertices,
        verticesb   = rec2.vertices,
        edge_index  = undefined,
        next_index  = undefined,
        len         = simplex.length,
        vera        = undefined,
        verb        = undefined,
        edge        = undefined,
        from_origin = undefined,
        normal      = undefined,
        result      = {
            distance: Number.MAX_SAFE_INTEGER,
            normal: undefined,
            index: undefined,
        };

    for (edge_index = 0; edge_index < len; edge_index++) {
        next_index = (edge_index + 1 === len) ? 0 : edge_index + 1;

        // Get vertices
        vera = simplex[edge_index].point;
        verb = simplex[next_index].point;

        // Get edge
        edge        = game.sub_vec(verb, vera);
        // from origin to point a
        from_origin = vera;

        // projection formula
        normal = game.sub_vec(from_origin,
                              game.scalar_vec(game.dot_prod(from_origin, edge) / game.sq_len_vec(edge),
                                              edge));

        distance = game.len_vec(normal);

        if (distance === 0) {
            result.distance = 0;
            result.normal = game.unit_normal(edge);
            result.index = edge_index;
        }

        if (distance < result.distance) {
            result.distance = distance;
            result.normal   = game.unit_vec(normal);
            result.index    = edge_index;
        }
    }

    return result;
};
