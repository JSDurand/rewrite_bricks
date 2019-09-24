/* global game background */


// the update function of the game
game.update = () => {

    if (game.envs.stop) {
        return;
    }

    // game.envs.stop = true;
    
    // clear the screen first
    background(0);
    
    // update positions
    // for (var i = 0; i < game.objects.length; i++) {
    //     var ob = game.objects[i];

    //     game.simulate_time(ob, game.envs.time / 20).draw_obj();
        // ob.update_position();
    // }

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

            // First push back a little so that they are not colliding.
            collision -= game.epsilon;

            // If they collide at the start, send them to contact solvers.
            if (collision < game.epsilon) {
                // TODO: Add a contact solver.
                contact = game.make_contact_solver(obj, obj2);
                game.envs.contact_solvers.push(contact);
                continue;
            }
            
            var gjk = game.gjk(game.simulate_time(obj , collision),
                               game.simulate_time(obj2, collision));

            // debugger;
            // Add a constraint.
            constraint = game.make_non_penetration_solver(obj, obj2, 0.95, gjk.first, gjk.second);
            game.envs.collision_constraints.push(constraint);
        }
    }

   // Solve collision constraints 

    var col_len = game.envs.collision_constraints.length;

    for (var collision_index = 0; collision_index < col_len; collision_index++) {
        var collision_constraint = game.envs.collision_constraints[collision_index];

        // debugger;
        collision_constraint.solve();
        collision_constraint.solve();
        collision_constraint.solve();
        collision_constraint.solve();
        collision_constraint.solve();
    }

    // After solving, clear the collision constraints.
    game.envs.collision_constraints = [];

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

    return;
};
