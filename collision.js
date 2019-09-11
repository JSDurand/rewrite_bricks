// detect the collision between polygons
/* global game */

game.collision = {};

game.collision.two_edges = (ea, eb) => {

};


game.collision.statics = (obja, objb) => {
    // The type of an object is either 0 or 1; 0 means polygon and 1 means circle.
    var type_sig = obja.type + 2 * objb.type;

    switch (type_sig) {
    case 0:
        // both are polygons

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
        break;
    case 1:
        // a is polygon and b is circle
        break;
    case 2:
        // b is polygon and a is circle
        break;
    case 3:
        // both are circles
        break;
    default:
        console.log("Wrong type signature: it should be 0, 1, 2, or 3, but it is " + type_sig);
        break;
    }
};
