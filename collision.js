/* global game */

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
    var type_sig = obja.type + 2 * objb.type;

    switch (type_sig) {
    case 0:
        // both are rectangles

        // take vertices
        var vera = obja.vertices(),
            verb = objb.vertices();

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
    // The type of an object is either 0 or 1; 0 means rectangle and 1 means circle.
    var type_sig = obja.type + 2 * objb.type;

    switch (type_sig) {
    case 0:
        // both are rectangles

        // take vertices
        var vera = obja.vertices(),
            verb = objb.vertices();

        // transform to edges
        var edgea = vera.map((e, i) => {
            return [e, vera[(i+1) % vera.length]];
        }),
            edgeb = verb.map((e, i) => {
            return [e, verb[(i+1) % verb.length]];
        });

        // First we do a simple bounding sphere test. After that we decide the intervals
        // to exclude by use of bounding spheres again. Then start by dividing the
        // interval [0,1] into different sub-intervals in which the Gauss maps do not
        // change signs. And then on each included interval, compute 8 polynomials, of
        // degree at most 9, to solve. At each such a root, compute the values of other 7
        // polynomials and check if they are all <= 0. If so, then that is a collision
        // time. Finally the collision time is determined as the smallest collision time.
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
