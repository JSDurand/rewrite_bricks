/* global game, ellipse, line */

// There are two most important constraint solvers: the first is the interpenetration
// constraint; the second is the joint constraint. The former is for the collisions of
// objects, and the latter is for forming rigid bodies out of convex polygons. In my plan,
// the whole process begins with a broad phase collision detection, such as the aabb tree.
// Next is the narrow phase collision detection using bilateral advancement to calculate
// the time of impact. Then we proceed to the contact solver. It uses the GJK algorithm to
// find the contact normals and the contact points. With this information we then enter
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
    this.dead   = false;
    // Default is a joint constraint.
    this.type   = "joint";
    // a prescribed distance constraint
    this.evaluate = function () {
        var bodyA              = this.bodyA,
            cxA                = bodyA.c_x,
            cyA                = bodyA.c_y,
            bodyB              = this.bodyB,
            cxB                = bodyB.c_x,
            cyB                = bodyB.c_y,
            cx                 = cxB - cxA,
            cy                 = cyB - cyA,
            bias_factor        = 0.75,
            tentative_velocity = [bodyB.vx - bodyA.vx, bodyB.vy - bodyA.vy],
            jacobian           = game.scalar_vec(1/game.len_vec([cx, cy]), [cx, cy]);

        return game.dot_prod(jacobian, tentative_velocity) +
            bias_factor * (game.len_vec([cx, cy]) - this.radius);
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

        if (bodyB.can_move) {
            this.bodyB.vx += impulse[0];
            this.bodyB.vy += impulse[1];
        }
    };
};

game.make_non_penetration_solver = function (bodyA, bodyB, bias, impact_time) {
    var solver = new game.constraint_solver(),
        cxA    = bodyA.c_x,
        cyA    = bodyA.C_y,
        cxB    = bodyB.c_x,
        cyB    = bodyB.C_y,
        cx     = cxB - cxA,
        cy     = cyB - cyA,
        normal = undefined,
        pointA = undefined,
        pointB = undefined,
        gjk    = game.gjk(bodyA, bodyB);

    solver.type = "non-penetration"; 

    var dir_a_to_b = [cx, cy],
        deepest_a  = game.support(bodyA, dir_a_to_b),
        deepest_b  = game.support(bodyB, game.scalar_vec(-1, dir_a_to_b));
            
    pointA = bodyA.vertices[deepest_a];
    pointB = bodyB.vertices[deepest_b];

    if (gjk.intersecting === false) {
        normal = game.sub_vec(pointB, pointA);
            
        if (game.dot_prod(normal, dir_a_to_b) < 0) {
            normal = game.scalar_vec(-1, normal);
        }
    } else {
        normal = game.epa(bodyA, bodyB, gjk.simplex).normal;
    }

    solver.bodyA       = bodyA;
    solver.bodyB       = bodyB;
    solver.bias        = bias;
    solver.normal      = game.unit_vec(normal);
    solver.impact_time = impact_time || 0;
    solver.evaluate    = function () {
        var bodyA          = this.bodyA,
            cxA            = bodyA.c_x,
            cyA            = bodyA.c_y,
            bodyB          = this.bodyB,
            cxB            = bodyB.c_x,
            cyB            = bodyB.c_y,
            gjk            = game.gjk(bodyA, bodyB),
            contact_info   = undefined;

        if (gjk.intersecting === false) {
            return 0;
        }

        contact_info = game.epa(bodyA, bodyB, gjk.simplex);

        return contact_info.distance;
    };

    solver.solve = function () {
        // FIXME: Add restitution!
        var bodyA  = this.bodyA,
            cxA    = bodyA.c_x,
            cyA    = bodyA.c_y,
            cA     = [cxA, cyA],
            mA     = 1 / bodyA.density,
            iA     = 1 / bodyA.inertia,
            bodyB  = this.bodyB,
            cxB    = bodyB.c_x,
            cyB    = bodyB.c_y,
            cB     = [cxB, cyB],
            mB     = 1 / bodyB.density,
            iB     = 1 / bodyB.inertia,
            cx     = cxB - cxA,
            cy     = cyB - cyA,
            normal = this.normal,
            count  = 0;

        var tentative_velocity = [bodyA.vx, bodyA.vy, bodyA.w, bodyB.vx, bodyB.vy, bodyB.w],
            jacobian           = [-1 * normal[0], -1 * normal[1],
                                  -1 * game.cross_2d(game.sub_vec(pointB, cA), normal),
                                  normal[0], normal[1],
                                  game.cross_2d(game.sub_vec(pointA, cB), normal)],
            effective_mass     = 1 / (mA + mB + iA * Math.pow(jacobian[2], 2)
                                      + iB * Math.pow(jacobian[5], 2)),
            bias_factor        = this.bias,
            // constraint         = Math.abs(game.len_vec([cx, cy]) - 100),
            constraint         = this.evaluate(),
            lambda             = -1 * effective_mass * (1.9 * game.dot_prod(jacobian, tentative_velocity)
                                                        - bias_factor * constraint / (1 - this.impact_time)),
            impulse            = game.scalar_vec(lambda, jacobian);

        // For friction
        this.bodyA.normal_impulse = Math.abs(lambda);
        this.bodyB.normal_impulse = Math.abs(lambda);

        if (bodyA.can_move) {
            this.bodyA.vx += impulse[0] * mA;
            this.bodyA.vy += impulse[1] * mA;
            this.bodyA.w  += impulse[2] * iA;

            // if (bodyB.can_move === false) {
            //     this.bodyA.vx -= impulse[3] * mB;
            //     this.bodyA.vy -= impulse[4] * mB;
            //     this.bodyA.w  -= impulse[5] * iB;
            // }
        }

        if (bodyB.can_move) {
            this.bodyB.vx += impulse[3] * mB;
            this.bodyB.vy += impulse[4] * mB;
            this.bodyB.w  += impulse[5] * iB;

            // if (bodyA.can_move === false) {
            //     this.bodyB.vx -= impulse[0] * mA;
            //     this.bodyB.vy -= impulse[1] * mA;
            //     this.bodyB.w  -= impulse[2] * iA;
            // }
        }

        // test
        this.dead = true;
    };

    return solver;
};


// Clamping operation
game.clamp = function (x, min, max) {
    return Math.min(max, Math.max(x, min));
};

game.make_friction_constraint = function (bodyA, bodyB) {
    var solver = new game.constraint_solver(),
        cxA    = bodyA.c_x,
        cyA    = bodyA.C_y,
        cxB    = bodyB.c_x,
        cyB    = bodyB.C_y,
        cx     = cxB - cxA,
        cy     = cyB - cyA,
        normal = undefined,
        pointA = undefined,
        pointB = undefined,
        gjk    = game.gjk(bodyA, bodyB);

    solver.type = "friction";

    var dir_a_to_b = [cx, cy],
        deepest_a  = game.support(bodyA, dir_a_to_b),
        deepest_b  = game.support(bodyB, game.scalar_vec(-1, dir_a_to_b));
            
    pointA = bodyA.vertices[deepest_a];
    pointB = bodyB.vertices[deepest_b];

    if (gjk.intersecting === false) {
        normal = game.sub_vec(pointB, pointA);
            
        if (game.dot_prod(normal, dir_a_to_b) < 0) {
            normal = game.scalar_vec(-1, normal);
        }
    } else {
        normal = game.epa(bodyA, bodyB, gjk.simplex).normal;
    }

    solver.bodyA   = bodyA;
    solver.bodyB   = bodyB;
    // The direction does not matter.
    solver.tangent = game.unit_normal(normal);
    solver.pointA  = pointA;
    solver.pointB  = pointB;

    solver.evaluate = function () {
        var bodyA              = this.bodyA,
            bodyB              = this.bodyB,
            tentative_velocity = [bodyB.vx, bodyB.vy, bodyB.w],
            cxB                = bodyB.c_x,
            cyB                = bodyB.c_y,
            cB                 = [cxB, cyB],
            mB                 = 1 / bodyB.density,
            iB                 = 1 / bodyB.inertia,
            jacobian           = [this.tangent[0], this.tangent[1],
                                  game.cross_2d(game.sub_vec(pointA, cB), this.tangent)];

        return game.dot_prod(jacobian, tentative_velocity);
    };

    solver.solve = function () {
        var bodyA              = this.bodyA,
            mA                 = 1 / bodyA.density,
            iA                 = 1 / bodyA.inertia,
            bodyB              = this.bodyB,
            tentative_velocity = [bodyB.vx, bodyB.vy, bodyB.w],
            cxB                = bodyB.c_x,
            cyB                = bodyB.c_y,
            cB                 = [cxB, cyB],
            mB                 = 1 / bodyB.density,
            iB                 = 1 / bodyB.inertia,
            jacobian           = [this.tangent[0], this.tangent[1],
                                  game.cross_2d(game.sub_vec(pointA, cB), this.tangent)],
            effective_mass     = 1 / (mB + iB * Math.pow(jacobian[2], 2)),
            lambda             = -1 * effective_mass * (game.dot_prod(jacobian, tentative_velocity)),
            normal_impulse     = bodyB.normal_impulse,
            friction_coeff     = bodyB.friction_coeff,
            clamped_lambda     = game.clamp(lambda,
                                            -friction_coeff * normal_impulse,
                                            friction_coeff * normal_impulse),
            impulse            = game.scalar_vec(1.2 * lambda, jacobian);


        if (bodyB.can_move) {
            this.bodyB.vx += impulse[0] * mB;
            this.bodyB.vy += impulse[1] * mB;
            this.bodyB.w  += impulse[2] * iB;

            // if (bodyA.can_move === false) {
            //     this.bodyB.vx -= impulse[0] * mA;
            //     this.bodyB.vy -= impulse[1] * mA;
            //     this.bodyB.w  -= impulse[2] * iA;
            // }
        }

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


// lambda         = game.clamp(lambda, -Number.MAX_SAFE_INTEGER, 0);
// total_lambda  += lambda;
// impulse        = game.scalar_vec(lambda, jacobian);

// while (count < 3) {
//     count++;

//     // prev_lambda        = total_lambda;
//     tentative_velocity = [bodyA.vx, bodyA.vy, bodyA.w, bodyB.vx, bodyB.vy, bodyB.w];
//     lambda             = -1 * effective_mass * (1.9 * game.dot_prod(jacobian, tentative_velocity)
//                                                 - bias_factor * constraint / (1 - this.impact_time));
//     // total_lambda      += lambda;
//     // total_lambda       = game.clamp(total_lambda, -Number.MAX_SAFE_INTEGER, 0);
//     impulse            = game.scalar_vec(lambda, jacobian);

//     this.bodyA.vx += impulse[0] * mA;
//     this.bodyA.vy += impulse[1] * mA;
//     this.bodyA.w  += impulse[2] * iA;

//     this.bodyB.vx += impulse[3] * mB;
//     this.bodyB.vy += impulse[4] * mB;
//     this.bodyB.w  += impulse[5] * iB;
// }

// debugger;


