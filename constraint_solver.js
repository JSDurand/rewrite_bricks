/* global game, ellipse, line */

// TODO: add constaint solvers

// There are two most important constraint solvers: the first is the interpenetration
// constraint; the second is the joint constraint. The former is for the collisions of
// objects, and the latter is for forming rigid bodies out of convex polygons. In my plan,
// the whole process begins with a broad phase collision detection, such as the aabb tree.
// Next is the narrow phase collision detection using bilateral advancement to calculate
// the time of impact. Then we proceed to the contact solver. It uses the GJK algorithm to
// find the contact normals and the contact points. WIth this information we then enter
// the constraint solving part: from the constraint we consider the Jacobian, and then
// solve for the Lagrangian multiplier. This gives us the constraint force, which allows
// us to calculate the constraint impulses to apply to objects. After these two
// constraints are implemented, the spring constraint might be considered. But, with the
// mechanism of a general constraint solver, it is not too hard to do so, especially when
// the springs are not involved with complex mathematics IMHO.

game.constraint_solver = function () {
    this.bodyA  = null;
    this.bodyB  = null;
    this.dead   = 0;
    this.radius = 100;
    // a prescribed distance constraint
    this.evaluate = function () {
        var bodyA = this.bodyA,
            cxA   = bodyA.c_x,
            cyA   = bodyA.c_y,
            bodyB = this.bodyB,
            cxB   = bodyB.c_x,
            cyB   = bodyB.c_y,
            cx    = cxB - cxA,
            cy    = cyB - cyA;

        return game.len_vec([cx, cy]) - 100;
    };
    this.solve = function () {
        var bodyA = this.bodyA,
            cxA   = bodyA.c_x,
            cyA   = bodyA.c_y,
            bodyB = this.bodyB,
            cxB   = bodyB.c_x,
            cyB   = bodyB.c_y,
            cx    = cxB - cxA,
            cy    = cyB - cyA;

        var tentative_velocity = [bodyB.vx - bodyA.vx, bodyB.vy - bodyA.vy],
            jacobian           = game.scalar_vec(1/game.len_vec([cx, cy]), [cx, cy]),
            effective_mass     = 1 / game.sq_len_vec(jacobian),
            bias_factor        = 0.75,
            constraint         = Math.abs(game.len_vec([cx, cy]) - this.radius),
            lambda             = -1 * effective_mass * (game.dot_prod(jacobian, tentative_velocity) + bias_factor * constraint),
            impulse            = game.scalar_vec(lambda, jacobian);

        this.bodyB.vx += impulse[0];
        this.bodyB.vy += impulse[1];
    };
};

game.make_non_penetration_solver = function (bodyA, bodyB, bias, pointA, pointB) {
    var solver = new game.constraint_solver(),
        cxA    = bodyA.c_x,
        cyA    = bodyA.C_y,
        cxB    = bodyB.c_x,
        cyB    = bodyB.C_y,
        cx     = cxB - cxA,
        cy     = cyB - cyA,
        normal = undefined;

    if (pointA && pointB) {
        normal = game.sub_vec(pointB, pointA);
    } else {
        var dir_a_to_b = [cx, cy],
            deepest_a  = game.support(bodyA, dir_a_to_b),
            deepest_b  = game.support(bodyB, game.scalar_vec(-1, dir_a_to_b));

        pointA = bodyA.vertices[deepest_a];
        pointB = bodyB.vertices[deepest_b];
        normal = game.sub_vec(bodyB.vertices[deepest_b], bodyA.vertices[deepest_a]);

        if (game.dot_prod(normal, dir_a_to_b) < 0) {
            normal = game.scalar_vec(-1, normal);
        }
    }

    solver.bodyA    = bodyA;
    solver.bodyB    = bodyB;
    solver.bias     = bias;
    solver.normal   = game.unit_vec(normal);
    solver.evaluate = function () {
        var bodyA = this.bodyA,
            cxA   = bodyA.c_x,
            cyA   = bodyA.c_y,
            bodyB = this.bodyB,
            cxB   = bodyB.c_x,
            cyB   = bodyB.c_y,
            cx    = cxB - cxA,
            cy    = cyB - cyA;

        var dir_a_to_b = [cx, cy],
            deepest_a  = game.support(bodyA, dir_a_to_b),
            deepest_b  = game.support(bodyB, game.scalar_vec(-1, dir_a_to_b)),
            delta_vec  = game.sub_vec(bodyB.vertices[deepest_b], bodyA.vertices[deepest_a]);

        return game.dot_prod(delta_vec, dir_a_to_b);

        // if (game.dot_prod(delta_vec, dir_a_to_b) >= game.epsilon) {
        //     return 0;
        // } else {
        //     return 1;
        // }
    };

    solver.solve = function () {
        var bodyA  = this.bodyA,
            cxA    = bodyA.c_x,
            cyA    = bodyA.c_y,
            cA     = [cxA, cyA],
            mA     = bodyA.density,
            iA     = bodyA.inertia,
            bodyB  = this.bodyB,
            cxB    = bodyB.c_x,
            cyB    = bodyB.c_y,
            cB     = [cxB, cyB],
            mB     = bodyB.density,
            iB     = bodyB.inertia,
            cx     = cxB - cxA,
            cy     = cyB - cyA,
            normal = this.normal;

        var tentative_velocity = [bodyA.vx, bodyA.vy, bodyA.w, bodyB.vx, bodyB.vy, bodyB.w],
            jacobian           = [-1 * normal[0], -1 * normal[1],
                                  -1 * game.cross_2d(game.sub_vec(pointA, cA), normal),
                                  normal[0], normal[1],
                                  game.cross_2d(game.sub_vec(pointB, cB), normal)],
            effective_mass     = 1 / (mA + mB + iA * Math.pow(jacobian[2], 2)
                                      + iB * Math.pow(jacobian[5], 2)),
            bias_factor        = this.bias,
            // constraint         = Math.abs(game.len_vec([cx, cy]) - 100),
            constraint         = this.evaluate(),
            lambda             = -1 * effective_mass * (game.dot_prod(jacobian, tentative_velocity)
                                                        + bias_factor * constraint),
            impulse            = game.scalar_vec(lambda, jacobian);

        this.bodyA.vx += impulse[0] / mA;
        this.bodyA.vy += impulse[1] / mA;
        this.bodyA.w  += impulse[2] / iA;

        // debugger;


        this.bodyB.vx += impulse[3] / mB;
        this.bodyB.vy += impulse[4] / mB;
        this.bodyB.w  += impulse[5] / iB;

        // test
        this.dead = true;
    };

    return solver;
};


// test
// game.constraint_solver.prototype.solve = function () {
//     var bodyA = this.bodyA,
//         cxA   = bodyA.c_x,
//         cyA   = bodyA.c_y,
//         bodyB = this.bodyB,
//         cxB   = bodyB.c_x,
//         cyB   = bodyB.c_y,
//         cx    = cxB - cxA,
//         cy    = cyB - cyA;

//     var tentative_velocity = [bodyB.vx - bodyA.vx, bodyB.vy - bodyA.vy],
//         jacobian           = game.scalar_vec(1/game.len_vec([cx, cy]), [cx, cy]),
//         effective_mass     = 1 / game.sq_len_vec(jacobian),
//         bias_factor        = 0.1,
//         constraint         = game.len_vec([cx, cy]) - 100,
//         lambda             = -1 * effective_mass * (game.dot_prod(jacobian, tentative_velocity) + bias_factor * constraint),
//         impulse            = game.scalar_vec(lambda, jacobian);

//     this.bodyB.vx += impulse[0];
//     this.bodyB.vy += impulse[1];
// };
