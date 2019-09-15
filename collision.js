/* global game performance */

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
    var type_sig = obja.type + (objb.type << 1);

    switch (type_sig) {
    case 0:
        // both are rectangles

        // take vertices
        var ver1 = obja.vertices,
            ver2 = objb.vertices;

        // transform to edges
        var edgea = ver1.map((e, i) => {
            return [e, ver1[(i+1) % ver1.length]];
        }),
            edgeb = ver2.map((e, i) => {
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
        var number_of_intervals = Math.floor((w2 - w1) / 180);

        if (number_of_intervals >= 0) {
            number_of_intervals += 1;
        }

        // loop each subinterval

        for (var n = 0; n < Math.abs(number_of_intervals); n++) {
            // do this
            
        }

        
        // var p2 = performance.now();
        // return p2-p0;
        // return [exclude_point1, exclude_point2];
        
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
