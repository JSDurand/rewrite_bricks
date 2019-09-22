/* global game background */


// the update function of the game
game.update = () => {
    game.envs.time += 1;

    if (game.envs.time > 20) {
        console.log("ended");
        game.update = function () {};
        return;
    }
    
    // console.log("running");
    // clear the screen first
    background(0);
    
    // update positions
    // for (var i = 0; i < game.objects.length; i++) {
    //     var ob = game.objects[i];

    //     game.simulate_time(ob, game.envs.time / 20).draw_obj();
        // ob.update_position();
    // }

    // check collisions and respond to those

    // draw objects
    for (var i = 0; i < game.objects.length; i++) {
        var ob = game.objects[i];

        ob.draw_obj();
    }

    return;
};
