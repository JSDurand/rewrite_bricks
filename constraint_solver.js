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
    this.bodyA = null;
    this.bodyB = null;
    // a prescribed distance constraint
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
            bias_factor        = 0.9,
            constraint         = game.len_vec([cx, cy]) - 100,
            lambda             = -1 * effective_mass * (game.dot_prod(jacobian, tentative_velocity) + bias_factor * constraint),
            impulse            = game.scalar_vec(lambda, jacobian);

        this.bodyB.vx += impulse[0];
        this.bodyB.vy += impulse[1];
    };
};

// TODO: make another type of solvers: non-penetration solvers.


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
