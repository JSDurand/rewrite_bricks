/* global game */

// This file implements the GJK algorithm

game.gjk = function (rec1, rec2, initial_direction=[1,0]) {
    var start            = game.support_in_minkowski_difference(rec1, rec2, initial_direction),
        simplex_array    = [start],
        search_direction = game.scalar_vec(-1, start.point),
        new_obj          = {},
        near_obj         = {},
        result           = {},
        found            = false;

    while (!found) {
        try {
            new_obj = game.support_in_minkowski_difference(rec1, rec2, search_direction);
        }
        catch (error) {
            throw("search_direction: " + search_direction);
        }
        
        if (game.dot_prod(new_obj.point, search_direction) <
            game.dot_prod(simplex_array[0].point, search_direction) + game.epsilon) {
            // no significant improvement
            if (simplex_array.length === 1) {
                // this is the closest point

                result = {
                    first: rec1.vertices[simplex_array[0].first],
                    second: rec2.vertices[simplex_array[0].second],
                    intersecting: false,
                };
                found = true;
            } else if (simplex_array.length === 2) {
                // it is on the line
                if (simplex_array[0].first === simplex_array[1].first) {
                    var to_origin    = game.scalar_vec(-1, simplex_array[0].point),
                        line_vector  = game.sub_vec(simplex_array[1].point,
                                                    simplex_array[0].point),
                        normal       = game.add_vec(simplex_array[0].point,
                                                    game.scalar_vec(game.dot_prod(line_vector, to_origin) / game.sq_len_vec(line_vector), line_vector)),
                        target_point = rec1.vertices[simplex_array[0].first];

                    result = {
                        first: target_point,
                        second: game.sub_vec(target_point, normal),
                        intersecting: false,
                    };
                    found = true;
                } else if (simplex_array[0].second === simplex_array[1].second) {
                    to_origin    = game.scalar_vec(-1, simplex_array[0].point);
                    line_vector  = game.sub_vec(simplex_array[1].point,
                                               simplex_array[0].point);
                    normal       = game.add_vec(simplex_array[0].point,
                                                game.scalar_vec(game.dot_prod(line_vector, to_origin) / game.sq_len_vec(line_vector), line_vector));
                    target_point = rec2.vertices[simplex_array[0].second];

                    result = {
                        first: game.add_vec(target_point, normal),
                        second: target_point,
                        intersecting: false,
                    };
                    found = true;
                } else {
                    // clearly this could be improved.
                    throw("gjk: origin is between vertices of the minkowski sum that are not neighbours.");
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
                    first: null,
                    second: null,
                    intersecting: true,
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
        
        if (game.dot_prod(vec_difference, to_origin) > 0) {
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
        if (game.dot_prod(first_second_normal, first_to_third) > 0) {
            first_second_normal = game.scalar_vec(-1, first_second_normal);
        }

        // adjust direction to face outwards
        if (game.dot_prod(first_third_normal, first_to_second) > 0) {
            first_third_normal  = game.scalar_vec(-1, first_third_normal);
        }

        if (game.dot_prod(to_origin, first_second_normal) > 0) {
            if (game.dot_prod(to_origin, first_to_second) > 0) {
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
        } else if (game.dot_prod(to_origin, first_third_normal) > 0) {
            if (game.dot_prod(to_origin, first_to_third) > 0) {
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
                simplex: null,
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

