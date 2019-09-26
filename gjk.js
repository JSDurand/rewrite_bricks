/* global game */

// This file implements the GJK algorithm

// Description of the result of this function: It is an object of the form {type: n,
// indices: array, first: pi, second: pj, intersecting: bool, simplex: simplex}. Here type
// is an integer from 0 to 2; 0 = both are points; 1 = the first is an edge; 2 = the
// second is an edge. Then indices is an array of two numbers, the first element of which
// is the index of the point / edge on the first polygon, and the second the second. Also
// first / second is the point. Finally simplex is returned only when the two objects
// intersect, and it is used for the expanding polytope algorithm.

game.gjk = function (rec1, rec2, initial_direction=[1,0]) {
    var start            = game.support_in_minkowski_difference(rec1, rec2, initial_direction),
        simplex_array    = [start],
        search_direction = game.scalar_vec(-1, start.point),
        new_obj          = {},
        near_obj         = {},
        result           = {},
        found            = false,
        to_origin        = undefined,
        edge_number      = undefined,
        line_vector      = undefined,
        normal           = undefined,
        target_point     = undefined,
        count            = 0;

    while (!found && count < 20) {
        count++;
        
        new_obj = game.support_in_minkowski_difference(rec1, rec2, search_direction);
        
        if (game.dot_prod(new_obj.point, search_direction) <
            game.dot_prod(simplex_array[0].point, search_direction) + game.epsilon) {
            // no significant improvement

            if (simplex_array.length === 1) {
                // this is the closest point

                result = {
                    type: 0,
                    indices: [simplex_array[0].first, simplex_array[0].second],
                    first: rec1.vertices[simplex_array[0].first],
                    second: rec2.vertices[simplex_array[0].second],
                    intersecting: false,
                    simplex: undefined,
                };
                found = true;
            } else if (simplex_array.length === 2) {
                // it is on the line
                if (simplex_array[0].first === simplex_array[1].first) {
                    to_origin    = game.scalar_vec(-1, simplex_array[0].point);
                    edge_number  = undefined;
                    line_vector  = game.sub_vec(simplex_array[1].point,
                                                simplex_array[0].point);
                    normal       = game.add_vec(simplex_array[0].point,
                                                game.scalar_vec(game.dot_prod(line_vector, to_origin) / game.sq_len_vec(line_vector), line_vector));
                    target_point = rec1.vertices[simplex_array[0].first];

                    if (Math.abs(simplex_array[1].second - simplex_array[0].second) === 1) {
                        edge_number = Math.min(simplex_array[1].second, simplex_array[0].second);
                    } else {
                        edge_number = Math.max(simplex_array[1].second, simplex_array[0].second);
                    }

                    result = {
                        type: 2,
                        indices: [simplex_array[0].first, edge_number],
                        first: target_point,
                        second: game.sub_vec(target_point, normal),
                        intersecting: false,
                        simplex: undefined,
                    };
                    found = true;
                } else if (simplex_array[0].second === simplex_array[1].second) {
                    to_origin    = game.scalar_vec(-1, simplex_array[0].point);
                    edge_number  = undefined;
                    line_vector  = game.sub_vec(simplex_array[1].point,
                                               simplex_array[0].point);
                    normal       = game.add_vec(simplex_array[0].point,
                                                game.scalar_vec(game.dot_prod(line_vector, to_origin) / game.sq_len_vec(line_vector), line_vector));
                    target_point = rec2.vertices[simplex_array[0].second];

                    if (Math.abs(simplex_array[1].first - simplex_array[0].first) === 1) {
                        edge_number = Math.min(simplex_array[1].first, simplex_array[0].first);
                    } else {
                        edge_number = Math.max(simplex_array[1].first, simplex_array[0].first);
                    }

                    result = {
                        type: 1,
                        indices: [edge_number, simplex_array[0].second],
                        first: game.add_vec(target_point, normal),
                        second: target_point,
                        intersecting: false,
                        simplex: undefined,
                    };
                    found = true;
                } else {
                    // clearly this could be improved.
                    result = {
                        type: undefined,
                        indices: [],
                        first: undefined,
                        second: undefined,
                        intersecting: true,
                        simplex: simplex_array,
                    };
                    found = true;
                    // throw("gjk: origin is between vertices of the minkowski sum that are not neighbours.");
                }
            } else {
                throw("gjk: too many points on the simplex array: " + simplex_array.length);
            }

        } else {
            simplex_array = [].concat([new_obj], simplex_array);
            near_obj      = game.nearest_simplex(simplex_array);

            if (near_obj.contains_origin) {
                found = true;
                result = {
                    type: undefined,
                    indices: [],
                    first: undefined,
                    second: undefined,
                    intersecting: true,
                    simplex: near_obj.simplex,
                };
            } else {
                simplex_array    = near_obj.simplex;
                search_direction = near_obj.search_direction;
            }
        }
    }

    return result;
};

// support function

// Returns the index of the vertex of the rectangle that has the largest inner-product
// with the given direction.
game.support = function (rectangle, direction) {
    var vertices = rectangle.vertices,
        result   = 0,
        dot      = game.dot_prod(vertices[result], direction),
        temp     = 0;

    for (var i = 1; i < vertices.length; i++) {
        temp = game.dot_prod(vertices[i], direction);

        if (temp > dot) {
            dot    = temp;
            result = i;
        }
    }

    return result;
};

// a variant

game.support_in_minkowski_difference = function (rec1, rec2, direction) {
    var first_index  = game.support(rec1, direction),
        second_index = game.support(rec2, game.scalar_vec(-1, direction)),
        result       = {
            first : first_index,
            second: second_index,
            point : game.sub_vec(rec1.vertices[first_index], rec2.vertices[second_index]),
        };

    return result;
};

// nearest simplex function

game.nearest_simplex = function (arr) {
    var len       = arr.length,
        new_point = arr[0].point, // the first point is always the newly added one.
        result    = {};

    // at least two points in ARR. 
    switch (len) {
    case 2:
        var second_point   = arr[1].point,
            vec_difference = game.sub_vec(second_point, new_point),
            to_origin      = game.scalar_vec(-1, new_point);
        
        if (game.dot_prod(vec_difference, to_origin) > game.epsilon) {
            result = {
                simplex: arr,
                search_direction: game.sub_vec(to_origin, game.scalar_vec(
                    game.dot_prod(vec_difference, to_origin) / game.sq_len_vec(vec_difference), vec_difference)),
                contains_origin: false,
            };
        } else {
            result = {
                simplex: [arr[0]],
                search_direction: game.scalar_vec(-1, new_point),
                contains_origin: false,
            };
        }
        break;
    case 3:
        var second_point        = arr[1].point,
            third_point         = arr[2].point,
            first_to_second     = game.sub_vec(second_point, new_point),
            first_to_third      = game.sub_vec(third_point,  new_point),
            first_second_normal = game.normal_vec(first_to_second),
            first_third_normal  = game.normal_vec(first_to_third),
            to_origin           = game.scalar_vec(-1, new_point);

        // adjust direction to face outwards
        if (game.dot_prod(first_second_normal, first_to_third) > game.epsilon) {
            first_second_normal = game.scalar_vec(-1, first_second_normal);
        }

        // adjust direction to face outwards
        if (game.dot_prod(first_third_normal, first_to_second) > game.epsilon) {
            first_third_normal  = game.scalar_vec(-1, first_third_normal);
        }

        if (game.dot_prod(to_origin, first_second_normal) > game.epsilon) {
            if (game.dot_prod(to_origin, first_to_second) > game.epsilon) {
                result = {
                    simplex: [arr[0], arr[1]],
                    search_direction: game.sub_vec(to_origin, game.scalar_vec(
                        game.dot_prod(first_to_second, to_origin) / game.sq_len_vec(first_to_second), first_to_second)),
                    contains_origin: false,
                };
            } else {
                result = {
                    simplex: [arr[0]],
                    search_direction: to_origin,
                    contains_origin: false,
                };
            }
        } else if (game.dot_prod(to_origin, first_third_normal) > game.epsilon) {
            if (game.dot_prod(to_origin, first_to_third) > game.epsilon) {
                result = {
                    simplex: [arr[0], arr[2]],
                    search_direction: game.sub_vec(to_origin, game.scalar_vec(
                        game.dot_prod(first_to_third, to_origin) / game.sq_len_vec(first_to_third), first_to_third)),
                    contains_origin: false,
                };
            } else {
                result = {
                    simplex: [arr[0]],
                    search_direction: to_origin,
                    contains_origin: false,
                };
            }
        } else {
            result = {
                simplex: arr,
                search_direction: null,
                contains_origin: true,
            };
        }

        break;
    default:
        throw("nearest_simplex: there should be only two or three points in the array, but we got " + len);
        break;
    }

    return result;
};

