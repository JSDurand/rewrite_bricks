/* global game */

// TODO: add contact solvers

// The contact solver is supposed to be simple: after the collision detection finds two
// polygons are colliding, the contact solver receives the contact normal and the contact
// constant. Then the contact solver pushes the two polygons, or one polygon and one
// plane, away from each other, proportional to the inverses of their masses. Now I have
// to think of a way for the collision detection algorithm to not only return the time of
// impact, but also the contact normal and the contact constant.

game.contact_solver = function () {
    this.bodyA = undefined;
    this.bodyB = undefined;

    this.solve = function () {
    };
};

game.make_contact_solver = function (bodyA, bodyB) {
    var solver = new game.contact_solver();

    solver.bodyA    = bodyA;
    solver.bodyB    = bodyB;

    solver.solve = function () {
        var mA              = bodyA.density,
            mB              = bodyB.density,
            cxA             = bodyA.c_x,
            cyA             = bodyA.C_y,
            cxB             = bodyB.c_x,
            cyB             = bodyB.C_y,
            cx              = cxB - cxA,
            cy              = cyB - cyA,
            dir_a_to_b      = [cx, cy],
            deepest_a       = game.support(bodyA, dir_a_to_b),
            deepest_b       = game.support(bodyB, game.scalar_vec(-1, dir_a_to_b)),
            pointA          = bodyA.vertices[deepest_a],
            pointB          = bodyB.vertices[deepest_b],
            translation_vec = game.sub_vec(pointA, pointB);

        bodyA.translate(translation_vec[0] * mB / (mA + mB), translation_vec[1] * mB / (mA + mB));
        bodyB.translate(-1 * translation_vec[0] * mA / (mA + mB), -1 * translation_vec[1] * mA / (mA + mB));
    };

    return solver;
};
