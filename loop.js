/* global game background, line, ellipse, stroke */


// the update function of the game
game.update = () => {

    if (game.envs.stop) {
        return;
    }

    // game.envs.stop = true;
    
    // clear the screen first
    background(0);
    
    var obj_len    = game.objects.length,
        contact    = undefined,
        constraint = undefined; 

    for (var obj_index = 0; obj_index < obj_len; obj_index++) {
        var obj = game.objects[obj_index];

        for (var obj2_index = obj_index + 1; obj2_index < obj_len; obj2_index++) {
            var obj2      = game.objects[obj2_index],
                // Collision occurs at collision time.
                collision = game.collision.continuous(obj, obj2);
            
            if (collision === false) {
                // no collision
                // console.log("no collision: " + collision);
                continue;
            }

            // First push forward a little so that they are colliding.
            collision += game.epsilon;

            // If they collide at the start, send them to contact solvers.
            if (collision < 2 * game.epsilon) {
                contact = game.make_contact_solver(obj, obj2);
                game.envs.contact_solvers.push(contact);
            }
            
            // Add a constraint.
            constraint = game.make_non_penetration_solver(obj, obj2, 0.95, collision);
            game.envs.constraint_solvers.push(constraint);

            // constraint = game.make_friction_constraint(obj, obj2);
            // obj2.constraint_solver.push(constraint);

            // constraint = game.make_friction_constraint(obj2, obj);
            // obj.constraint_solver.push(constraint);
        }
    }

    // Solve collision constraints 

    game.solve_constraints();

    // update objects
    for (var i = 0; i < obj_len; i++) {
        var ob = game.objects[i];

        ob.update_position();
    }

    // solve contacts

    for (var contact_index = 0; contact_index < game.envs.contact_solvers.length; contact_index++) {
        var solver = game.envs.contact_solvers[contact_index];

        solver.solve();
    }

    game.envs.contact_solvers = [];


    for (var i = 0; i < obj_len; i++) {
        var ob = game.objects[i];

        ob.draw_obj();
    }

    for (var constraint_index = 0; constraint_index < game.envs.constraint_solvers.length; constraint_index++) {
        var constraint_solver = game.envs.constraint_solvers[constraint_index];
        
        if (constraint_solver.type === "joint") {
            var pa = game.translateCoordinate([constraint_solver.bodyA.c_x, constraint_solver.bodyA.c_y]),
                pb = game.translateCoordinate([constraint_solver.bodyB.c_x, constraint_solver.bodyB.c_y]);

            stroke(constraint_solver.bodyA.color);
            ellipse(pa[0], pa[1], 5, 5);
            stroke(constraint_solver.bodyB.color);
            ellipse(pb[0], pb[1], 5, 5);
            line(pa[0], pa[1], pb[0], pb[1]);
        }
    }

    return;
};

game.solve_constraints = function () {
    var col_len       = game.envs.constraint_solvers.length,
        num_iteration = 10,
        obj_len       = game.objects.length;

    for (var index = 0; index < obj_len; index++) {
        var body = game.objects[index];

        for (var force = 0; force < body.external_forces.length; force++) {
            body.vx += body.external_forces[force].x / body.density;
            body.vy += body.external_forces[force].y / body.density;
        }
    }

    for (var iteration = 0; iteration < num_iteration; iteration++) {
        for (var constraint_index = 0; constraint_index < col_len; constraint_index++) {
            var constraint_solver = game.envs.constraint_solvers[constraint_index];

            if (!(constraint_solver.evaluate_velocity())) {
                constraint_solver.solve();
            }
        }
    }

    // After solving, clear dead collision constraints.
    game.envs.constraint_solvers = game.envs.constraint_solvers.filter(function (e) {
        return e.dead === false;
    });

};
