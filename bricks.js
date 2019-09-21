/* global game stroke fill beginShape endShape vertex line */

// implements the bricks

game.add_brick = (params) => {
    var vertices = params["vertices"] || [[0, 0], [20, 0], [20, 20], [0, 20]],
        density  = params["density"]  || 1,
        color    = params["color"]    || "red",
        can_move = params["can_move"] || false,
        vx       = params["vx"]       || 0,
        vy       = params["vy"]       || 0,
        w        = params["w"]        || 0;

    // FIXME: Fix this inefficient id-assigning method.
    var old_id   = -1;

    for (var i = 0; i < game.objects.length; i++) {
        var ob = game.objects[i];
        if (ob.id >= old_id) {
            old_id = ob.id;
        }
    }

    var brick = {
        type    : 0,
        vertices: vertices,
        vx      : vx,
        vy      : vy,
        w       : w,
        density : density,
        color   : color,
        can_move: can_move,
        id      : old_id + 1,
        vertices: vertices,

        // center
        c_x: function () {
            var res = 0,
                len = this.vertices.length;

            for (var i = 0; i < len; i++) {
                res += vertices[i][0];
            }

            return res / len;
        },
        c_y: function () {
            var res = 0,
                len = this.vertices.length;

            for (var i = 0; i < len; i++) {
                res += vertices[i][1];
            }

            return res / len;
        },
        // translation by a vector
        translate: function (x, y) {
            this.motion_updated  = false;
            for (var i = 0; i < this.vertices.length; i++) {
                var vi = this.vertices[i],
                    vx = vi[0],
                    vy = vi[1];
                vertices[i] =  [x + vx, y + vy];
            }
        },
        // general movement as a linear mapping in the projective space
        move: function (move_matrix) {
            this.motion_updated = false;
            for (var i = 0; i < this.vertices.length; i++) {
                this.vertices[i] = game.mul_mat_on_vec(move_matrix, [].concat(this.vertices[i], [1]));
            }
        },
        get_in_screen: function () {
            for (var i = 0; i < this.vertices.length; i++) {
                var vi      = vertices[i],
                    x       = vi[0],
                    y       = vi[1],
                    lengthx = game.envs.width  / 2,
                    lengthy = game.envs.height / 2;

                if (x < -1 * lengthx) {
                    this.translate(-1 * lengthx - x, 0);
                }
                if (x > lengthx) {
                    this.translate(lengthx - x, 0);
                }
                if (y < -1 * lengthy) {
                    this.translate(0, -1 * lengthy - y);
                }
                if (y > lengthy) {
                    this.translate(0, lengthy - y);
                }
            }
        },

        motion_matrix: null,

        // produces a 3-d matrix that is responsible for moving the brick. Since this is
        // relatively heavy to compute, this should only be called when computing
        // collisions, and once for every pair.
        update_motion_matrix: function () {
            var cosw           = Math.cos(this.w),
                sinw           = Math.sin(this.w),
                cx             = this.c_x(),
                cy             = this.c_y();
            this.motion_matrix =
                [[cosw, -1 * sinw, -1 * cosw * cx + sinw * cy + cx + this.vx],
                 [sinw, cosw     , -1 * sinw * cx - cosw * cy + cy + this.vy] ,
                 [0   , 0        , 1]];
        },
        update_position: function () {
            this.move(this.motion_matrix);

            if (!this.motion_updated) {
                this.update_motion_matrix();
            }

            // We shall add the structure of contact solvers later.
            this.get_in_screen();
        },
        draw_obj: function () {
            stroke(this.color);
            
            for (var i = 0; i < this.vertices.length; i++) {
                var pi = game.translateCoordinate(this.vertices[i]);
                var pii = game.translateCoordinate(this.vertices[ (i+1) % this.vertices.length]);
                line(pi[0], pi[1], pii[0], pii[1]);
            }

            // fill("black");
            // beginShape();
            // for (var i = 0; i < this.vertices.length; i++) {
            //     var pi = game.translateCoordinate(vertices[i]);
            //     vertex(pi[0], pi[1]);
            // }
            // vertex(game.translateCoordinate(vertices[0])[0], game.translateCoordinate(vertices[0])[1]);
            // endShape();
        },
    };

    game.objects.push(brick);
};

// Simulate the position at time.
game.simulate_time = function (rec, time) {
    var cosw           = Math.cos(rec.w * time),
        sinw           = Math.sin(rec.w * time),
        cx             = rec.c_x(),
        cy             = rec.c_y(),
        motion_matrix  = [[cosw, -1 * sinw, -1 * cosw * cx + sinw * cy + cx + rec.vx * time],
                          [sinw, cosw     , -1 * sinw * cx - cosw * cy + cy + rec.vy * time] ,
                          [0   , 0        , 1]],
        new_brick      = game.clone(rec);

    new_brick.vertices =  rec.vertices.map(function (e) {
        return game.mul_mat_on_vec(motion_matrix, [].concat(e, [1])).slice(0, 2);
    });

    return new_brick;
};
