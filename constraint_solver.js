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
    this.bodyA          = undefined;
    this.bodyB          = undefined;
    this.dead           = false;
    this.radius         = undefined;
    this.jacobian       = undefined;
    this.effective_mass = undefined;
    this.bias           = undefined;
    this.type           = undefined;
    this.mA             = undefined;
    this.mB             = undefined;
    this.iA             = undefined;
    this.iB             = undefined;
    this.cxA            = undefined;
    this.cyA            = undefined;
    this.cxB            = undefined;
    this.cyB            = undefined;
    this.acc_lambda     = undefined; // accumulated impulse
    // a prescribed distance constraint
    this.evaluate_position = function () {
    };
    this.evaluate_velocity = function () {
    };
    this.solve = function () {
    };
};

game.make_joint_solver = function (bodyA, bodyB, radius=100, bias=0.7) {
    var solver = new game.constraint_solver(),
        mA     = 1 / bodyA.density,
        mB     = 1 / bodyB.density,
        iA     = 1 / bodyA.inertia,
        iB     = 1 / bodyB.inertia;

    if (mA === Infinity) {
        mA = 0;
    }

    if (mB === Infinity) {
        mB = 0;
    }

    solver.bodyA          = bodyA;
    solver.bodyB          = bodyB;
    solver.mA             = mA;
    solver.mB             = mB;
    solver.iA             = iA;
    solver.iB             = iB;
    solver.type           = "joint";
    solver.radius         = radius;
    solver.cxA            = bodyA.c_x;
    solver.cyA            = bodyA.c_y;
    solver.cxB            = bodyB.c_x;
    solver.cyB            = bodyB.c_y;
    solver.bias           = bias;
    solver.effective_mass = 1 / (mA + mB);
    solver.acc_lambda     = 0;

    var cx = solver.cxA - solver.cxB,
        cy = solver.cyA - solver.cyB;

    solver.jacobian = game.scalar_vec(1/game.len_vec([cx, cy]), [cx, cy, -cx, -cy]);

    solver.evaluate_position = function () {
        var cx = this.bodyA.c_x - this.bodyB.c_x,
            cy = this.bodyA.c_y - this.bodyB.c_y;

        return game.len_vec([cx, cy]) - this.radius;
    };

    solver.evaluate_velocity = function () {
        var bodyA              = this.bodyA,
            bodyB              = this.bodyB,
            tentative_velocity = [bodyA.vx, bodyA.vy, bodyB.vx, bodyB.vy],
            cx                 = bodyA.c_x - bodyB.c_x,
            cy                 = bodyA.c_y - bodyB.c_y,
            jacobian           = game.scalar_vec(1/game.len_vec([cx, cy]), [cx, cy, -cx, -cy]);

        return Math.abs(game.dot_prod(jacobian, tentative_velocity)) < game.epsilon;
    };

    solver.solve = function () {
        var bodyA = this.bodyA,
            mA    = this.mA,
            cxA   = bodyA.c_x,
            cyA   = bodyA.c_y,
            bodyB = this.bodyB,
            cxB   = bodyB.c_x,
            cyB   = bodyB.c_y,
            cx    = cxA - cxB,
            cy    = cyA - cyB,
            mB    = this.mB;

        var tentative_velocity = [bodyA.vx, bodyA.vy, bodyB.vx, bodyB.vy],
            jacobian           = game.scalar_vec(1/game.len_vec([cx, cy]), [cx, cy, -cx, -cy]),
            effective_mass     = this.effective_mass,
            bias_factor        = this.bias,
            constraint         = this.evaluate_position(),
            lambda             = -1 * effective_mass * (game.dot_prod(jacobian, tentative_velocity) + bias_factor * constraint),
            old_acc            = this.acc_lambda;

        this.acc_lambda += lambda;

        // if (this.acc_lambda < 0) {
        //     this.acc_lambda = 0;
        // }

        lambda = this.acc_lambda - old_acc;

        var impulse = game.scalar_vec(lambda, jacobian);
        
        if (bodyA.can_move) {
            this.bodyA.vx += impulse[0] * mA;
            this.bodyA.vy += impulse[1] * mA;
        }
        if (bodyB.can_move) {
            this.bodyB.vx += impulse[2] * mB;
            this.bodyB.vy += impulse[3] * mB;
        }
    };

    return solver;
};

game.make_non_penetration_solver = function (bodyA, bodyB, bias=0.4, impact_time) {
    var solver = new game.constraint_solver(),
        cxA    = bodyA.c_x,
        cyA    = bodyA.c_y,
        cxB    = bodyB.c_x,
        cyB    = bodyB.c_y,
        cx     = cxB - cxA,
        cy     = cyB - cyA,
        cA     = [cxA, cyA],
        cB     = [cxB, cyB],
        normal = undefined,
        pointA = undefined,
        pointB = undefined,
        gjk    = game.gjk(bodyA, bodyB),
        mA     = 1 / bodyA.density,
        mB     = 1 / bodyB.density,
        iA     = 1 / bodyA.inertia,
        iB     = 1 / bodyB.inertia;

    if (mA === Infinity) {
        mA = 0;
    }

    if (mB === Infinity) {
        mB = 0;
    }

    if (iA === Infinity) {
        iA = 0;
    }

    if (iB === Infinity) {
        iB = 0;
    }

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

    solver.mA                = mA;
    solver.mB                = mA;
    solver.iA                = iA;
    solver.iB                = iA;
    solver.cxA               = bodyA.c_x;
    solver.cyA               = bodyA.c_y;
    solver.cxB               = bodyB.c_x;
    solver.cyB               = bodyB.c_y;
    solver.jacobian          = [-1 * normal[0], -1 * normal[1],
                                -1 * game.cross_2d(game.sub_vec(pointB, cA), normal),
                                normal[0], normal[1],
                                game.cross_2d(game.sub_vec(pointA, cB), normal)];
    solver.effective_mass    = 1 / (mA + mB + iA * Math.pow(solver.jacobian[2], 2)
                                    + iB * Math.pow(solver.jacobian[5], 2));
    solver.bodyA             = bodyA;
    solver.bodyB             = bodyB;
    solver.bias              = bias;
    solver.acc_lambda        = 0;
    solver.normal            = game.unit_vec(normal);
    solver.impact_time       = impact_time || 0;
    solver.gjk               = gjk;
    solver.evaluate_position = function () {
        var bodyA        = this.bodyA,
            bodyB        = this.bodyB,
            gjk          = this.gjk,
            contact_info = undefined;

        if (gjk.intersecting === false) {
            return 0;
        }

        contact_info = game.epa(bodyA, bodyB, gjk.simplex);

        return contact_info.distance;
    };

    solver.evaluate_velocity = function () {
        var bodyA              = this.bodyA,
            bodyB              = this.bodyB,
            tentative_velocity = [bodyA.vx, bodyA.vy, bodyB.vx, bodyB.vy];

        return game.dot_prod(this.jacobian, tentative_velocity) < 0;
    };

    solver.solve = function () {
        // FIXME: Add restitution!
        var bodyA  = this.bodyA,
            mA     = this.mA,
            bodyB  = this.bodyB,
            mB     = this.mB,
            iA     = this.iA,
            iB     = this.iB;

        var tentative_velocity = [bodyA.vx, bodyA.vy, bodyA.w, bodyB.vx, bodyB.vy, bodyB.w],
            jacobian           = this.jacobian,
            effective_mass     = this.effective_mass,
            bias_factor        = this.bias,
            constraint         = this.evaluate_position(),
            lambda             = -1 * effective_mass * (0.3 * game.dot_prod(jacobian, tentative_velocity)
                                                        - bias_factor * constraint / (1 - this.impact_time)),
            old_acc            = this.acc_lambda;

        this.acc_lambda += lambda;

        if (this.acc_lambda < 0) {
            this.acc_lambda = 0;
        }

        lambda = this.acc_lambda - old_acc;

        var impulse = game.scalar_vec(lambda, jacobian);

        if (bodyA.can_move) {
            this.bodyA.vx += impulse[0] * mA;
            this.bodyA.vy += impulse[1] * mA;
            this.bodyA.w  += impulse[2] * iA;
        }

        if (bodyB.can_move) {
            this.bodyB.vx += impulse[3] * mB;
            this.bodyB.vy += impulse[4] * mB;
            this.bodyB.w  += impulse[5] * iB;
        }

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
        cyA    = bodyA.c_y,
        cxB    = bodyB.c_x,
        cyB    = bodyB.c_y,
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


