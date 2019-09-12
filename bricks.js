/* global game stroke rect fill */

// implements the bricks

game.add_brick = (minx, miny, lenx, leny, density, color, can_move, vx=0, vy=0) => {
    var old_id = -1;

    for (var i = 0; i < game.objects.length; i++) {
        var ob = game.objects[i];
        if (ob.id >= old_id) {
            old_id = ob.id;
        }
    }

    
    var brick = {
        minx: minx || 0,
        miny: miny || 0,
        lenx: lenx || 20,
        leny: leny || 20,
        vx: vx,
        vy: vy,
        density: density || 1,
        color: color || "red",
        can_move: can_move || false,
        id: old_id + 1,
        update: function () {
            this.minx += this.vx;
            this.miny += this.vy;
        },
        draw_obj: function () {
            stroke(this.color);
            fill(this.color);
            rect(this.minx+game.envs.origin.x, this.miny+game.envs.origin.y, this.lenx, this.leny);
        },
    };

    game.objects.push(brick);
};
