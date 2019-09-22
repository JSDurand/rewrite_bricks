/* global game stroke fill beginShape endShape vertex line, ellipse */

// implements the bricks

game.add_brick = (params) => {
    var vertices = params["vertices"] || [[0, 0], [20, 0], [20, 20], [0, 20]],
        density  = params["density"]  || 1,
        color    = params["color"]    || "red",
        can_move = params["can_move"] || false,
        vx       = params["vx"]       || 0,
        vy       = params["vy"]       || 0,
        cx       = 0,
        cy       = 0,
        w        = params["w"]        || 0,
        len      = vertices.length;

    for (var i = 0; i < len; i++) {
        cx += vertices[i][0];
        cy += vertices[i][1];
    }

    game.envs.id += 1;

    var brick = {
        type    : 0,
        vertices: vertices,
        vx      : vx,
        vy      : vy,
        w       : w,
        density : density,
        color   : color,
        can_move: can_move,
        id      : game.envs.id,
        vertices: vertices,

        // center
        c_x: cx / len,
        c_y: cy / len,

        // translation by a vector
        translate: function (x, y) {
            this.motion_updated  = false;
            for (var i = 0; i < this.vertices.length; i++) {
                var vi = this.vertices[i],
                    vx = vi[0],
                    vy = vi[1];

                this.vertices[i] =  [x + vx, y + vy];
            }
        },
        // general movement as a linear mapping in the projective space
        // move: function (move_matrix) {
        //     this.motion_updated = false;
        //     for (var i = 0; i < this.vertices.length; i++) {
        //         this.vertices[i] = game.mul_mat_on_vec(move_matrix, [].concat(this.vertices[i], [1]));
        //     }
        // },
        // TODO: This should be incorporated into a contact solver.
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

        // motion_matrix: null,

        // produces a 3-d matrix that is responsible for moving the brick. Since this is
        // relatively heavy to compute, this should only be called when computing
        // collisions, and once for every pair.
        // update_motion_matrix: function () {
        //     var cosw = Math.cos(this.w),
        //         sinw = Math.sin(this.w),
        //         cx   = this.c_x(),
        //         cy   = this.c_y();

        //     this.motion_matrix =
        //         [[cosw, -1 * sinw, -1 * cosw * cx + sinw * cy + cx + this.vx],
        //          [sinw, cosw     , -1 * sinw * cx - cosw * cy + cy + this.vy] ,
        //          [0   , 0        , 1]];
        // },
        update_position: function () {
            // this.move(this.motion_matrix);
            var w    = this.w * Math.PI / 180,
                cosw = Math.cos(this.w),
                sinw = Math.sin(this.w),
                cx   = this.c_x,
                cy   = this.c_y;

            for (var i = 0; i < this.vertices.length; i++) {
                var vi  = this.vertices[i],
                    vix = vi[0],
                    viy = vi[1];

                this.vertices[i] = [
                    cosw * (vix - cx) - sinw * (viy - cy) + cx + this.vx,
                    sinw * (vix - cx) + cosw * (viy - cy) + cy + this.vy,
                ];
            }

            this.c_x += this.vx;
            this.c_y += this.vy;

            this.get_in_screen();
        },
        draw_obj: function () {
            stroke(this.color);
            
            for (var i = 0; i < this.vertices.length; i++) {
                var pi = game.translateCoordinate(this.vertices[i]);
                var pii = game.translateCoordinate(this.vertices[ (i+1) % this.vertices.length]);
                line(pi[0], pi[1], pii[0], pii[1]);
            }

            // for testing purposes
            var p0 = game.translateCoordinate(this.vertices[0]);
            ellipse(p0[0], p0[1], 5, 5);

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
    var w             = rec.w * Math.PI / 180,
        cosw          = Math.cos(w * time),
        sinw          = Math.sin(w * time),
        cx            = rec.c_x,
        cy            = rec.c_y,
        // motion_matrix = [[cosw, -1 * sinw, -1 * cosw * cx + sinw * cy + cx + rec.vx * time],
        //                  [sinw, cosw     , -1 * sinw * cx - cosw * cy + cy + rec.vy * time] ,
        //                  [0   , 0        , 1]],
        new_brick     = {
            draw_obj: rec.draw_obj,
            vertices: [],
            color: rec.color,
            vx: rec.vx,
            vy: rec.vy,
            w: w,
        };

    for (var i = 0; i < rec.vertices.length; i++) {
        var vi  = rec.vertices[i],
            vix = vi[0],
            viy = vi[1];
        
        new_brick.vertices[i] = [
            cosw * (vix - cx) - sinw * (viy - cy) + cx + rec.vx * time,
            sinw * (vix - cx) + cosw * (viy - cy) + cy + rec.vy * time,
        ];
    }

    new_brick.c_x = cx;
    new_brick.c_y = cy;

    return new_brick;
};


// ARCHIVE


// c_x: function () {
//     var res = 0,
//         len = this.vertices.length;

//     for (var i = 0; i < len; i++) {
//         res += vertices[i][0];
//     }

//     return res / len;
// },
// c_y: function () {
//     var res = 0,
//         len = this.vertices.length;

//     for (var i = 0; i < len; i++) {
//         res += vertices[i][1];
//     }

//     return res / len;
// },
