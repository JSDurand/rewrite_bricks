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

        // take vertices
        var vera = obja.vertices,
            verb = objb.vertices;

        // transform to edges
        var edgea = vera.map( (e, i) => {
            return [e, vera[(i+1) % vera.length]];
        }),
            edgeb = verb.map( (e, i) => {
            return [e, verb[(i+1) % verb.length]];
        });

        for (var i = 0; i < edgea.length; i++) {
            for (var j = 0; j < edgeb.length; j++) {
                if (game.collision.two_edges(edgea[i], edgeb[j])) {
                    return true;
                }
            }
        }
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

        // First we do a simple bounding sphere test. After that we decide the intervals
        // to exclude by use of bounding spheres again. Then start by dividing the
        // interval [0,1] into different sub-intervals in which the Gauss maps do not
        // change signs. And then on each included interval, compute 8 polynomials, of
        // degree at most 5, to solve. At each such a root, compute the values of other 7
        // polynomials and check if they are all <= 0. If so, then that is a collision
        // time. Finally the collision time is determined as the smallest collision time,
        // so we may proceed from the smallest interval forward, until we reach a
        // collision time, or conclude there is no collision.

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
        var exclude_point1 = null,
            exclude_point2 = null,
            relative_c     = game.sub_vec(c2, c1),
            relative_v     = game.sub_vec(v2, v1),
            discriminant   = Math.pow(game.dot_prod(relative_c, relative_v), 2) - game.sq_len_vec(relative_v) * (game.sq_len_vec(relative_c) - Math.pow(r1 + r2, 2));

        if (discriminant < 0) {
            return false;
        } else {
            exclude_point1 = (-1 * game.dot_prod(relative_c, relative_v) - Math.sqrt(discriminant)) / game.sq_len_vec(relative_v); 
            exclude_point2 = (-1 * game.dot_prod(relative_c, relative_v) + Math.sqrt(discriminant)) / game.sq_len_vec(relative_v); 
        }

        // number of intervals
        var angle      = game.angle_between_vectors(
            game.sub_vec(edge1[0][1], edge1[0][0]),
            game.sub_vec(edge2[0][1], edge2[0][0])),
            relative_w = w2 - w1,
            abs_w      = Math.abs(relative_w);
        
        var number_of_intervals;
        
        if (relative_w > 0) {
            number_of_intervals = Math.floor((relative_w + angle) / 90) - Math.ceil(angle / 90) + 2;
        } else {
            number_of_intervals = Math.floor(angle / 90) - Math.ceil((relative_w + angle) / 90) + 2;
        }

        // loop each subinterval

        var m         = null,
            t_between = null,
            t         = null,
            beg       = null,
            end       = null;

        console.log("number of intervals: " + number_of_intervals);
        for (var n = 0; n < number_of_intervals; n++) {

            relative_w = w2 - w1; // needs to fix this
            console.log("The " + (n + 1) + "-th interval");

            // the multiple of 90 is denoted as m

            if (number_of_intervals === 1) {
                m   = 0;
                t   = 0;
                beg = 0;
                end = 1;
            } else if (relative_w > 0) {
                if (n === 0) {
                    m = Math.ceil(angle / 90) + n;
                } else {
                    m = Math.ceil(angle / 90) + n - 1;
                }

                t_between = (m * 90 - angle) / relative_w;
                if (n === 0) {
                    t   = t_between / 2;
                    beg = 0;
                    end = t_between;
                } else if (n === number_of_intervals - 1) {
                    t   = (1 + t_between) / 2;
                    beg = t_between;
                    end = 1;
                } else {
                    t   = t_between - 45 / relative_w;
                    beg = t_between - 90 / relative_w;
                    end = t_between;
                }
            } else {
                if (n === 0) {
                    m = Math.ceil((relative_w + angle) / 90) + n;
                } else {
                    m = Math.ceil((relative_w + angle) / 90) + n - 1;
                }
                t_between = (m * 90 - angle) / relative_w;
                if (n === 0) {
                    t   = t_between / 2;
                    beg = 0;
                    end = t_between;
                } else if (n === number_of_intervals - 1) {
                    t   = (1 + t_between) / 2;
                    beg = t_between;
                    end = 1;
                } else {
                    t   = t_between - 45 / relative_w;
                    beg = t_between - 90 / relative_w;
                    end = t_between;
                }
            }

            // console.log("m = " + m);
            // console.log("w2 - w1 = " + (w2 - w1));
            // console.log("angle = " + angle);
            // console.log("t_between = " + ((m * 90) - angle) / relative_w);
            // console.log("t = " + t);

            if (beg < exclude_point1 && end < exclude_point1) {
                console.log("BST: beg = " + beg + " and end = " + end);
                continue;
            }
            if (beg > exclude_point2 && end > exclude_point2) {
                console.log("BST: beg = " + beg + " and end = " + end);
                continue;
            }
            
            var stepped_rec1 = game.step_time(obja, t),
                stepped_rec2 = game.step_time(objb, t);

            var pair12 = game.minkowski(stepped_rec1, stepped_rec2),
                pair21 = game.minkowski(stepped_rec2, stepped_rec1);

            if (typeof(pair12) === "undefined") {
                return game.collision.continuous_parallel(obja, objb);
            }
            
            var center     = [stepped_rec1.c_x(), stepped_rec1.c_y()],
                polynomial = [],
                roots      = [];

            for (var index_of_pairs = 0; index_of_pairs < pair12.length / 2; index_of_pairs++) {
                // we only consider the last half of the pairs, since the first half of
                // the equations are too difficult to solve: the polynomials are of
                // too high degrees. Note that here the there are 8 pairs in pair12, but
                // we only consider the last 4 of them.
                var last_half_index = index_of_pairs + pair12.length / 2,
                    // This is an array of two numbers.
                    the_pair        = pair12[last_half_index];

                var degree0 = 0,
                    degree1 = 0,
                    degree2 = 0,
                    degree3 = 0,
                    degree4 = 0;

                // some constants
                var point      = stepped_rec2.vertices[the_pair[0]],
                    edge_start = stepped_rec1.vertices[the_pair[1]];
                
                relative_v = game.sub_vec(v2, v1);

                // FIXME: The polynomial is wrong.
                // TODO: adapt bilateral advancement algorithm and GJK then.

                if (the_pair[1] % 2 === 0) {
                    degree0 = point[1] + edge_start[1] + (point[0] - center[0]) * (angle - Math.pow(angle, 3) / 6) - (point[1] - center[1]) * (angle * angle / 2);
                    degree1 = relative_w * (point[0] - center[0]) - w1 * center[0] + relative_v[1] - (point[0] - center[0]) * (relative_w * angle * angle / 2) - (point[1] - center[1]) * relative_w * angle;
                    degree2 = (center[1] - point[1]) * relative_w * relative_w / 2 - w1 * relative_v[0] - w1 * w1 * center[1] / 2 - (point[0] - center[0]) * relative_w * relative_w * angle / 2;
                    degree3 = (center[0] - point[0]) * Math.pow(relative_w, 3) / 6 + Math.pow(w1, 3) * center[0] / 6 - Math.pow(w1, 2) * relative_v[1] / 2;
                    degree4 = Math.pow(w1, 3) * relative_v[0] / 6;
                } else {
                    degree0 = point[0] + edge_start[0] - (point[0] - center[0]) * angle * angle / 2 - (point[1] - center[1]) * (angle - Math.pow(angle, 3) / 6);
                    degree1 = relative_w * (point[1] - center[1]) + w1 * center[1] + relative_v[0] - (point[0] - center[0]) * relative_w * angle + (point[1] - center[1]) * relative_w * angle * angle / 2;
                    degree2 = (center[0] - point[0]) * relative_w * relative_w / 2 + w1 * relative_v[1] - w1 * w1 * center[0] / 2 + (point[1] - center[1]) * relative_w * relative_w * angle / 2;
                    degree3 = (point[1] - center[1]) * Math.pow(relative_w, 3) / 6 - Math.pow(w1, 3) * center[1] / 6 - Math.pow(w1, 2) * relative_v[0] / 2;
                    degree4 = -1 * Math.pow(w1, 3) * relative_v[1] / 6;
               }

                polynomial = game.trim_last_zeroes([degree0, degree1, degree2, degree3, degree4]);
                roots      = findRoots(polynomial);

                console.log("first roots: ");
                console.log(roots);

                if (roots.length === 0) {
                    console.log("No roots!");
                    continue;
                }
                
                for (var root_index = 0; root_index < roots[1].length; root_index++) {
                    if (Math.abs(roots[1][root_index]) < epsilon) {
                        // this could be a real root. Now check three / two conditions
                        var possible_time = roots[0][root_index],
                            cost          = Math.cos(relative_w * possible_time + angle),
                            sint          = Math.sin(relative_w * possible_time + angle),
                            cos_plum      = Math.cos(-1 * w1 * possible_time),
                            sin_plum      = Math.sin(-1 * w1 * possible_time);

                        if (possible_time < 0) {
                            console.log("found one negative root: " + possible_time);
                            continue;
                        } else if (possible_time > 1) {
                            console.log("Found one root greater than one: " + possible_time);
                            continue;
                        }


                        // First it should lie on the boundary line. Let us suppose that
                        // the numerical root finding is accurate enough for now. Change
                        // this depending upon the performances

                        var quantity_to_equal_zero = null;
                        if (the_pair[1] % 2 === 0) {
                            quantity_to_equal_zero = point[0] * sint + point[1] * cost - center[0] * sint - center[1] * cost + sin_plum * (center[0] + possible_time * relative_v[0]) + cos_plum * (center[1] + possible_time * relative_v[1]) + edge_start[1];
                        } else {
                            quantity_to_equal_zero = point[0] * cost - point[1] * sint - center[0] * cost + center[0] * sint + cos_plum * (center[0] + possible_time * relative_v[0]) - sin_plum * (center[1] + possible_time * relative_v[1]) + edge_start[0];
                        }

                        // if (Math.abs(quantity_to_equal_zero) >= epsilon) {
                        if (quantity_to_equal_zero <= 0) {
                            // this is probably a mistake in finding the roots; just ignore it.
                            console.log("Mistaken root: " + possible_time);
                            console.log("error: " + quantity_to_equal_zero);
                            continue;
                        }

                        // It is unfortunate to use a magic number 2 here: there are two
                        // neighbours equations to consider.
                        // det => determination
                        var det = true;
                        for (var neighbour_num = 0; neighbour_num < 2; neighbour_num++) {
                            var neighbour      = (the_pair[0] - neighbour_num + ver1.length) % ver1.length,
                                neighbour_pair = pair12.find(function(item) {
                                    return item[1] === neighbour;
                                });

                            // First transform the rec1 to be axis-aligned and centered at
                            // the origin, and extract useful information.
                            
                            var transformed_objs       = game.transform_Coord(obja, objb),
                                transformed_normal     = transformed_objs.normals,
                                transformed_center     = transformed_objs.center,
                                transformed_edge_start = transformed_objs.edge2[neighbour_pair[1]][0],
                                transformed_point      = transformed_objs.ver1[neighbour_pair[0]];

                            var moved_normal = [transformed_normal[0] * cost - transformed_normal[1] * sint,
                                                  transformed_normal[0] * sint + transformed_normal[1] * cost],
                                moved_thing  = [
                                    transformed_edge_start[0] * cost - transformed_edge_start[1] * sint - transformed_center[0] * cost + transformed_center[1] * sint + cos_plum * (transformed_center[0] + possible_time * relative_v[0]) - sin_plum * (transformed_center[1] + possible_time * relative_v[1]) + transformed_point[0],
                                    transformed_edge_start[0] * sint + transformed_edge_start[1] * cost - transformed_center[0] * sint - transformed_center[1] * cost + sin_plum * (transformed_center[0] + possible_time * relative_v[0]) + cos_plum * (transformed_center[1] + possible_time * relative_v[1]) + transformed_point[1]
                                ];

                            if (game.dot_prod(moved_normal, moved_thing) > 0) {
                                det = false;
                            }
                        }

                        if (!det) {
                            console.log("Found one root on the line but not in the interior: " + possible_time);
                            continue;
                        }

                        // if the loop goes here, then it might be a collision time.
                        console.log("roots index = " + root_index);
                        return possible_time;
                    } else {
                        console.log("Found one imaginary root: " + roots[0][root_index]);
                    }
                }

                
                // return roots;
            }

            center = [stepped_rec2.c_x(), stepped_rec2.c_y()];
            
            for (var index_of_pairs = 0; index_of_pairs < pair21.length / 2; index_of_pairs++) {
                // we only consider the last half of the pairs, since the first half of
                // the equations are too difficult to solve: the polynomials are of
                // too high degrees. Note that here the there are 8 pairs in pair12, but
                // we only consider the last 4 of them.
                var last_half_index = index_of_pairs + pair21.length / 2,
                    // This is an array of two numbers.
                    the_pair        = pair21[last_half_index];

                var degree0 = 0,
                    degree1 = 0,
                    degree2 = 0,
                    degree3 = 0,
                    degree4 = 0;

                // some constants
                var point      = stepped_rec1.vertices[the_pair[0]],
                    edge_start = stepped_rec2.vertices[the_pair[1]],
                    relative_w = w1 - w2;
                
                relative_v = game.sub_vec(v1, v2);

                if (the_pair[1] % 2 === 0) {
                    degree0 = point[1] + edge_start[1] + (point[0] - center[0]) * (angle - Math.pow(angle, 3) / 6) - (point[1] - center[1]) * (angle * angle / 2);
                    degree1 = relative_w * (point[0] - center[0]) - w2 * center[0] + relative_v[1] - (point[0] - center[0]) * (relative_w * angle * angle / 2) - (point[1] - center[1]) * relative_w * angle;
                    degree2 = (center[1] - point[1]) * relative_w * relative_w / 2 - w2 * relative_v[0] - w2 * w2 * center[1] / 2 - (point[0] - center[0]) * relative_w * relative_w * angle / 2;
                    degree3 = (center[0] - point[0]) * Math.pow(relative_w, 3) / 6 + Math.pow(w2, 3) * center[0] / 6 - Math.pow(w2, 2) * relative_v[1] / 2;
                    degree4 = Math.pow(w2, 3) * relative_v[0] / 6;
                } else {
                    degree0 = point[0] + edge_start[0] - (point[0] - center[0]) * angle * angle / 2 - (point[1] - center[1]) * (angle - Math.pow(angle, 3) / 6);
                    degree1 = relative_w * (point[1] - center[1]) + w2 * center[1] + relative_v[0] - (point[0] - center[0]) * relative_w * angle + (point[1] - center[1]) * relative_w * angle * angle / 2;
                    degree2 = (center[0] - point[0]) * relative_w * relative_w / 2 + w2 * relative_v[1] - w2 * w2 * center[0] / 2 + (point[1] - center[1]) * relative_w * relative_w * angle / 2;
                    degree3 = (point[1] - center[1]) * Math.pow(relative_w, 3) / 6 - Math.pow(w2, 3) * center[1] / 6 - Math.pow(w2, 2) * relative_v[0] / 2;
                    degree4 = -1 * Math.pow(w2, 3) * relative_v[1] / 6;
               }

                polynomial = game.trim_last_zeroes([degree0, degree1, degree2, degree3, degree4]);
                roots      = findRoots(polynomial);

                console.log("second roots: ");
                console.log(roots);
                
                if (roots.length === 0) {
                    console.log("No roots!");
                    continue;
                }
                
                for (var root_index = 0; root_index < roots[1].length; root_index++) {
                    if (Math.abs(roots[1][root_index]) < epsilon) {
                        // this could be a real root. Now check three / two conditions
                            possible_time = roots[0][root_index];
                            cost          = Math.cos(relative_w * possible_time + angle);
                            sint          = Math.sin(relative_w * possible_time + angle);
                            cos_plum      = Math.cos(-1 * w2 * possible_time);
                            sin_plum      = Math.sin(-1 * w2 * possible_time);

                        if (possible_time < 0) {
                            console.log("Found one negative root: " + possible_time);
                            continue;
                        } else if (possible_time > 1) {
                            console.log("Found one root greater than one: " + possible_time);
                            continue;
                        }

                        // First it should lie on the boundary line. Let us suppose that
                        // the numerical root finding is accurate enough for now. Change
                        // this depending upon the performances

                        var quantity_to_equal_zero = null;
                        if (the_pair[1] % 2 === 0) {
                            quantity_to_equal_zero = point[0] * sint + point[1] * cost - center[0] * sint - center[1] * cost + sin_plum * (center[0] + possible_time * relative_v[0]) + cos_plum * (center[1] + possible_time * relative_v[1]) + edge_start[1];
                        } else {
                            quantity_to_equal_zero = point[0] * cost - point[1] * sint - center[0] * cost + center[0] * sint + cos_plum * (center[0] + possible_time * relative_v[0]) - sin_plum * (center[1] + possible_time * relative_v[1]) + edge_start[0];
                        }

                        // if (Math.abs(quantity_to_equal_zero) >= epsilon) {
                        if (quantity_to_equal_zero <= 0) {
                            // this is probably a mistake in finding the roots; just ignore it.
                            console.log("Mistaken root: " + possible_time);
                            console.log("error: " + quantity_to_equal_zero);
                            continue;
                        }

                        // It is unfortunate to use a magic number 2 here: there are two
                        // neighbours equations to consider.
                        // det => determination
                        var det = true;
                        for (var neighbour_num = 0; neighbour_num < 2; neighbour_num++) {
                            var neighbour      = (the_pair[0] - neighbour_num + ver2.length) % ver2.length,
                                neighbour_pair = pair21.find(function(item) {
                                    return item[1] === neighbour;
                                });

                            // First transform the rec1 to be axis-aligned and centered at
                            // the origin, and extract useful information.
                            
                            var transformed_objs       = game.transform_Coord(objb, obja),
                                transformed_normal     = transformed_objs.normals,
                                transformed_center     = transformed_objs.center,
                                transformed_edge_start = transformed_objs.edge1[neighbour_pair[1]][0],
                                transformed_point      = transformed_objs.ver2[neighbour_pair[0]];

                            var moved_normal = [transformed_normal[0] * cost - transformed_normal[1] * sint,
                                                  transformed_normal[0] * sint + transformed_normal[1] * cost],
                                moved_thing  = [
                                    transformed_edge_start[0] * cost - transformed_edge_start[1] * sint - transformed_center[0] * cost + transformed_center[1] * sint + cos_plum * (transformed_center[0] + possible_time * relative_v[0]) - sin_plum * (transformed_center[1] + possible_time * relative_v[1]) + transformed_point[0],
                                    transformed_edge_start[0] * sint + transformed_edge_start[1] * cost - transformed_center[0] * sint - transformed_center[1] * cost + sin_plum * (transformed_center[0] + possible_time * relative_v[0]) + cos_plum * (transformed_center[1] + possible_time * relative_v[1]) + transformed_point[1]
                                ];

                            if (game.dot_prod(moved_normal, moved_thing) > 0) {
                                det = false;
                            }
                        }

                        if (!det) {
                            console.log("Found one root on the line but not in the interior: " + possible_time);
                            continue;
                        }

                        // if the loop goes here, then it might be a collision time.
                        return possible_time;
                    } else {
                        console.log("Found one imaginary root " + roots[0][root_index]);
                    }
                }

                
                // return roots;
            }
        }
        
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
