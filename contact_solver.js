/* global game */

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
            gjk             = game.gjk(bodyA, bodyB),
            contact_info    = undefined,
            contact_normal  = undefined;

        if (gjk.intersecting === false) {
            // Nothing needs to be done.
            return;
        }

        // Normal points from the first to the second.
        contact_info   = game.epa(bodyA, bodyB, gjk.simplex);
        contact_normal = game.scalar_vec(contact_info.distance, contact_info.normal);

        if (bodyA.can_move && bodyB.can_move) {
            bodyA.translate(-1 * contact_normal[0] * mB / (mA + mB), -1 * contact_normal[1] * mB / (mA + mB));
            bodyB.translate(contact_normal[0] * mA / (mA + mB), contact_normal[1] * mA / (mA + mB));
        } else if (bodyA.can_move) {
            bodyA.translate(-1 * contact_normal[0], -1 * contact_normal[1]);
        } else if (bodyB.can_move) {
            bodyB.translate(contact_normal[0], contact_normal[1]);
        } else {
            console.log("two non-moving objects colliding!");
        }
    };

    return solver;
};
