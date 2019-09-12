/* global game background */


// the update function of the game
game.update = () => {

    // clear the screen first
    background(0);
    
    // update positions
    for (var i = 0; i < game.objects.length; i++) {
        var ob = game.objects[i];

        ob.update_position();
    }

    // check collisions and respond to those

    // draw objects
    for (var i = 0; i < game.objects.length; i++) {
        var ob = game.objects[i];

        ob.draw_obj();
    }

};
