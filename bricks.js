/* global game stroke rect fill */

// implements the bricks

game.add_brick = (params) => {
    var minx     = params["minx"]     || 0,
        miny     = params["miny"]     || 0,
        lenx     = params["lenx"]     || 20,
        leny     = params["leny"]     || 20,
        density  = params["density"]  || 1,
        color    = params["color"]    || "red",
        can_move = params["can_move"] || false,
        vx       = params["vx"]       || 0,
        vy       = params["vy"]       || 0,
        w        = params["w"]        || 0;

    var old_id = -1;

    for (var i = 0; i < game.objects.length; i++) {
        var ob = game.objects[i];
        if (ob.id >= old_id) {
            old_id = ob.id;
        }
    }

    var brick = {
        minx     : minx,
        miny     : miny,
        lenx     : lenx,
        leny     : leny,
        vx       : vx,
        vy       : vy,
        w        : w,
        density  : density,
        color    : color,
        can_move : can_move,
        id       : old_id + 1,

        // normal means normal coordinates
        normal_min_x: function () {
            return this.minx;
        },
        normal_min_y: function () {
            return this.miny;
        },
        normal_max_x: function () {
            return this.minx + this.lenx;
        },
        normal_max_y: function () {
            return this.miny + this.leny;
        },

        // this is for drawing on the board
        min_x: function () {
            return this.minx + game.envs.origin.x;
        },
        min_y: function () {
            return -1 * this.miny + game.envs.origin.y;
        },
        max_x: function () {
            return this.minx + game.envs.origin.x + this.lenx;
        },
        max_y: function () {
            return -1 * this.miny + game.envs.origin.y - this.leny;
        },

        // center, on normal coordinates
        normal_c_x: function () {
            return this.minx + this.lenx / 2;
        },
        normal_c_y: function () {
            return this.miny + this.leny / 2;
        },
        vertices: function () {
            return [
                [this.normal_min_x(), this.normal_min_y()],
                [this.normal_max_x(), this.normal_min_y()],
                [this.normal_max_x(), this.normal_max_y()],
                [this.normal_min_x(), this.normal_max_y()],
            ];
        },
        get_in_screen: function () {
            if (this.min_x() < 0) {
                this.minx -= this.min_x();
                this.vx *= -1;
            }
            if (this.max_x() > game.envs.width) {
                this.minx += game.envs.width - this.max_x();
                this.vx *= -1;
            }
            if (this.min_y() > game.envs.height) {
                this.miny += game.envs.height - this.min_y();
                this.vy *= -1;
            }
            if (this.max_y() < 0) {
                this.miny -= this.max_y();
                this.vy *= -1;
            }
        },

        motion_matrix: null,

        // produces a 3-d matrix that is responsible for moving the brick. Since this is
        // relatively heavy to compute, this should only be called when computing
        // collisions, and once for every pair.
        update_motion_matrix: function () {
            var cosw           = Math.cos(this.w),
                sinw           = Math.sin(this.w),
                cx             = this.normal_c_x(),
                cy             = this.normal_c_y();
            this.motion_matrix =
                [[cosw, -1 * sinw, -1 * cosw * cx + sinw * cy + cx + this.vx],
                 [sinw, cosw     , -1 * sinw * cx -cosw * cy + cy + this.vy] ,
                 [0   , 0        , 1]];
        },
        update: function () {
            this.motion_updated  = false;
            this.minx           += this.vx;
            this.miny           += this.vy;
            this.get_in_screen();
        },
        draw_obj: function () {
            stroke(this.color);
            fill(this.color);
            rect(this.minx+game.envs.origin.x, this.miny+game.envs.origin.y, this.lenx, this.leny);
        },
    };

    game.objects.push(brick);
};
