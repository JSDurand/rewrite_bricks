/* global game stroke fill beginShape endShape vertex line, ellipse */

// implements the bricks

// the class of bricks
game.brick = function () {
    this.type              = 0;
    this.vertices          = [];
    this.vx                = 0;
    this.vy                = 0;
    this.w                 = 0;
    this.density           = 1;
    this.color             = undefined;
    this.can_move          = undefined;
    this.id                = undefined;
    this.constraint_solver = [];
    this.inertia           = undefined;
    this.c_x               = undefined;
    this.c_y               = undefined;
    this.angle_only        = false;
    // A force is an object of the form {x: fx, y: fy}.
    this.external_forces   = [];
    // For the determination of frictions.
    this.normal_impulse    = 0;
    // The friction coefficient.
    this.friction_coeff    = 0.5;

    this.translate = function (x, y) {
        if (this.angle_only || this.can_move === false) {
            return;
        }

        for (var i = 0; i < this.vertices.length; i++) {
            var vi = this.vertices[i],
                vx = vi[0],
                vy = vi[1];

            this.vertices[i] =  [x + vx, y + vy];
        }
        this.c_x += x;
        this.c_y += y;
    };
    
    this.get_in_screen = function () {
        var lengthx    = game.envs.width  / 2,
            lengthy    = game.envs.height / 2,
            x_converse = false,
            y_converse = false;

        for (var i = 0; i < this.vertices.length; i++) {
            var vi = this.vertices[i],
                x  = vi[0],
                y  = vi[1];

            if (x < -1 * lengthx) {
                this.translate(-1 * lengthx - x, 0);
                x_converse = true;
            }
            if (x > lengthx) {
                this.translate(lengthx - x, 0);
                x_converse = true;
            }
            if (y < -1 * lengthy) {
                this.translate(0, -1 * lengthy - y);
                y_converse = true;
            }
            if (y > lengthy) {
                this.translate(0, lengthy - y);
                y_converse = true;
            }
        }

        if (x_converse) {
            this.vx *= -1;
        }
        if (y_converse) {
            this.vy *= -1;
        }
    };

    this.update_position = function () {
        if (this.can_move === false) {
            return;
        }

        if (this.angle_only) {
            this.vx = 0;
            this.vy = 0;
        }

        var w                = this.w * Math.PI / 180,
            cosw             = Math.cos(w),
            sinw             = Math.sin(w),
            cx               = this.c_x,
            cy               = this.c_y,
            done             = false,
            constraint_count = 0,
            constraint       = undefined;

        // Maximum velocity should not be bypassed.

        if (game.sq_len_vec([this.vx, this.vy]) >= Math.pow(game.envs.max_vel, 2)) {
            var lambda = game.envs.max_vel / game.len_vec([this.vx, this.vy]);

            this.vx *= lambda;
            this.vy *= lambda;
        }

        if (Math.abs(this.w) >= game.envs.max_vel) {
            this.w = Math.sign(this.w) * game.envs.max_vel;
        }

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
    };

    this.draw_obj = function () {
        stroke(this.color);
        
        for (var i = 0; i < this.vertices.length; i++) {
            var pi  = game.translateCoordinate(this.vertices[i]);
            var pii = game.translateCoordinate(this.vertices[(i+1) % this.vertices.length]);
            line(pi[0], pi[1], pii[0], pii[1]);
        }

        // Drawing joint constraints
        // for (var c = 0; c < this.constraint_solver.length; c++) {
        //     var solver = this.constraint_solver[c];

        //     if (solver.type === "joint") {
        //         var bodyA  = solver.bodyA,
        //             bodyB  = solver.bodyB,
        //             p0     = game.translateCoordinate([bodyA.c_x, bodyA.c_y]),
        //             p1     = game.translateCoordinate([bodyB.c_x, bodyB.c_y]);

        //         ellipse(p0[0], p0[1], 5, 5);
        //         ellipse(p1[0], p1[1], 5, 5);
        //         line(p0[0], p0[1], p1[0], p1[1]);
        //     }
        // }
    };
};

game.add_brick = function (params) {
    var brick = new game.brick();

    // Actually density means mass in the game; density should be automatically
    // scaled.
    var center   = params["center"]   || {x: 0, y: 0},
        wd       = params["width"]    || 0,
        ht       = params["height"]   || 0,
        density  = params["density"]  || 1,
        color    = params["color"]    || "red",
        vx       = params["vx"]       || 0,
        vy       = params["vy"]       || 0,
        w        = params["w"]        || 0,
        angle    = params["angle"]    || 0,
        fake     = params["fake"]     || false;

    var can_move   = params["can_move"],
        angle_only = params["angle_only"];

    if (typeof(can_move) === "undefined") {
        can_move = true;
    }

    if (typeof(angle_only) === "undefined") {
        angle_only = false;
    }

    if (fake) {
        can_move = false;
    }

    brick.vertices = [[center.x - wd / 2, center.y - ht / 2],
                      [center.x + wd / 2, center.y - ht / 2],
                      [center.x + wd / 2, center.y + ht / 2],
                      [center.x - wd / 2, center.y + ht / 2]];

    angle *= Math.PI / 180;

    for (var vertex_index = 0; vertex_index < brick.vertices.length; vertex_index++) {
        var cosw = Math.cos(angle),
            sinw = Math.sin(angle),
            ver  = brick.vertices[vertex_index];

        brick.vertices[vertex_index] = [cosw * (ver[0] - center.x) - sinw * (ver[1] - center.y) + center.x,
                                        sinw * (ver[0] - center.x) + cosw * (ver[1] - center.y) + center.y];
    }
 
   // calculate the mass 
    density = density * wd * ht;

    // Calculate the moment of inertia. There is a division by 12 in fact, but let us
    // ignore it for now.
    var inertia = density * (wd * wd + ht * ht) / 10;

    // if (inertia === 0) {
    //     inertia = 1;
    // }

    game.envs.id++;

    brick.c_x             = center.x;
    brick.c_y             = center.y;
    brick.external_forces = [{x: game.envs.gravity.x * density,
                              y: game.envs.gravity.y * density}];
    brick.vx              = vx;
    brick.vy              = vy;
    brick.w               = w;
    brick.color           = color;
    brick.density         = density;
    brick.can_move        = can_move;
    brick.angle_only      = angle_only;
    brick.width           = wd;
    brick.height          = ht;
    brick.id              = game.envs.id;
    brick.inertia         = inertia;

    if (!fake) {
        game.objects.push(brick);
    }

    return brick;
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
            constraint_solver: rec.constraint_solver,
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

// game.add_brick = (params) => {
//     var vertices = params["vertices"] || [[0, 0], [0, 0], [0, 0], [0, 0]],
//         // actually density means mass in the game
//         // density should be automatically determined.
//         density  = params["density"]  || 1,
//         color    = params["color"]    || "red",
//         can_move = params["can_move"] || false,
//         vx       = params["vx"]       || 0,
//         vy       = params["vy"]       || 0,
//         cx       = 0,
//         cy       = 0,
//         w        = params["w"]        || 0,
//         len      = vertices.length,
//         fake     = params["fake"] || false;

//     for (var i = 0; i < len; i++) {
//         cx += vertices[i][0];
//         cy += vertices[i][1];
//     }

//     game.envs.id += 1;

//    // calculate the mass 
//     density = density * game.len_vec(game.sub_vec(vertices[1], vertices[0])) *
//         game.len_vec(game.sub_vec(vertices[2], vertices[1]));

//    // calculate the moment of inertia 

//     var inertia = density * (game.sq_len_vec(game.sub_vec(vertices[1], vertices[0])) +
//                              game.sq_len_vec(game.sub_vec(vertices[2], vertices[1])));

//     var brick = {
//         type             : 0,
//         vertices         : vertices,
//         vx               : vx,
//         vy               : vy,
//         w                : w,
//         density          : density,
//         color            : color,
//         can_move         : can_move,
//         id               : game.envs.id,
//         constraint_solver: [],
//         inertia          : inertia / 10,

//         // center
//         c_x: cx / len,
//         c_y: cy / len,

//         // translation by a vector
//         translate: function (x, y) {
//             this.motion_updated  = false;
//             for (var i = 0; i < this.vertices.length; i++) {
//                 var vi = this.vertices[i],
//                     vx = vi[0],
//                     vy = vi[1];

//                 this.vertices[i] =  [x + vx, y + vy];
//             }
//             this.c_x += x;
//             this.c_y += y;
//         },
//         // general movement as a linear mapping in the projective space
//         // move: function (move_matrix) {
//         //     this.motion_updated = false;
//         //     for (var i = 0; i < this.vertices.length; i++) {
//         //         this.vertices[i] = game.mul_mat_on_vec(move_matrix, [].concat(this.vertices[i], [1]));
//         //     }
//         // },
//         get_in_screen: function () {
//             var lengthx    = game.envs.width  / 2,
//                 lengthy    = game.envs.height / 2,
//                 x_converse = false,
//                 y_converse = false;

//             for (var i = 0; i < this.vertices.length; i++) {
//                 var vi         = vertices[i],
//                     x          = vi[0],
//                     y          = vi[1];

//                 if (x < -1 * lengthx) {
//                     this.translate(-1 * lengthx - x, 0);
//                     x_converse = true;
//                 }
//                 if (x > lengthx) {
//                     this.translate(lengthx - x, 0);
//                     x_converse = true;
//                 }
//                 if (y < -1 * lengthy) {
//                     this.translate(0, -1 * lengthy - y);
//                     y_converse = true;
//                 }
//                 if (y > lengthy) {
//                     this.translate(0, lengthy - y);
//                     y_converse = true;
//                 }
//             }

//             if (x_converse) {
//                 this.vx *= -1;
//             }
//             if (y_converse) {
//                 this.vy *= -1;
//             }
//         },

//         // motion_matrix: null,

//         // produces a 3-d matrix that is responsible for moving the brick. Since this is
//         // relatively heavy to compute, this should only be called when computing
//         // collisions, and once for every pair.
//         // update_motion_matrix: function () {
//         //     var cosw = Math.cos(this.w),
//         //         sinw = Math.sin(this.w),
//         //         cx   = this.c_x(),
//         //         cy   = this.c_y();

//         //     this.motion_matrix =
//         //         [[cosw, -1 * sinw, -1 * cosw * cx + sinw * cy + cx + this.vx],
//         //          [sinw, cosw     , -1 * sinw * cx - cosw * cy + cy + this.vy] ,
//         //          [0   , 0        , 1]];
//         // },
//         update_position: function () {
//             var w                = this.w * Math.PI / 180,
//                 cosw             = Math.cos(w),
//                 sinw             = Math.sin(w),
//                 cx               = this.c_x,
//                 cy               = this.c_y,
//                 done             = false,
//                 constraint_count = 0,
//                 constraint       = undefined;

//             // external forces
//             this.vx += game.envs.gravity.x / this.density;
//             this.vy += game.envs.gravity.y / this.density;

//             // constraint forces
//             var solvers = this.constraint_solver;

//             while (!done && constraint_count < 10) {
//                 constraint_count++;

//                 // this.constraint_solver = this.constraint_solver.filter(function (e) {
//                 //     return e.dead === 0;
//                 // });

//                 solvers = this.constraint_solver;

//                 for (var c = 0; c < solvers.length; c++) {
//                     constraint = solvers[c];

//                     if (constraint.evaluate() > game.epsilon) {
//                         constraint.solve();
//                     }
//                 }
//             }

//             for (var i = 0; i < this.vertices.length; i++) {
//                 var vi  = this.vertices[i],
//                     vix = vi[0],
//                     viy = vi[1];

//                 this.vertices[i] = [
//                     cosw * (vix - cx) - sinw * (viy - cy) + cx + this.vx,
//                     sinw * (vix - cx) + cosw * (viy - cy) + cy + this.vy,
//                 ];
//             }

//             this.c_x += this.vx;
//             this.c_y += this.vy;

//             this.get_in_screen();
//         },
//         draw_obj: function () {
//             stroke(this.color);
            
//             for (var i = 0; i < this.vertices.length; i++) {
//                 var pi = game.translateCoordinate(this.vertices[i]);
//                 var pii = game.translateCoordinate(this.vertices[ (i+1) % this.vertices.length]);
//                 line(pi[0], pi[1], pii[0], pii[1]);
//             }

//             // for testing purposes
//             for (var c = 0; c < this.constraint_solver.length; c++) {
//                 var solver = this.constraint_solver[c],
//                     bodyA  = solver.bodyA,
//                     bodyB  = solver.bodyB,
//                     p0     = game.translateCoordinate([bodyA.c_x, bodyA.c_y]),
//                     p1     = game.translateCoordinate([bodyB.c_x, bodyB.c_y]);

//                 ellipse(p0[0], p0[1], 5, 5);
//                 ellipse(p1[0], p1[1], 5, 5);
//                 line(p0[0], p0[1], p1[0], p1[1]);
//             }

//             // var p0     = game.translateCoordinate([this.c_x, this.c_y]),
//             //     origin = game.translateCoordinate([0, 0]);

//             // ellipse(p0[0], p0[1], 5, 5);
//             // ellipse(origin[0], origin[1], 5, 5);
//             // line(p0[0], p0[1], origin[0], origin[1]);

//             // fill("black");
//             // beginShape();
//             // for (var i = 0; i < this.vertices.length; i++) {
//             //     var pi = game.translateCoordinate(vertices[i]);
//             //     vertex(pi[0], pi[1]);
//             // }
//             // vertex(game.translateCoordinate(vertices[0])[0], game.translateCoordinate(vertices[0])[1]);
//             // endShape();
//         },
//     };

//     if (!fake) {
//         game.objects.push(brick);
//     }

//     return brick;
// };


// var p0     = game.translateCoordinate([this.c_x, this.c_y]),
//     origin = game.translateCoordinate([0, 0]);

// ellipse(p0[0], p0[1], 5, 5);
// ellipse(origin[0], origin[1], 5, 5);
// line(p0[0], p0[1], origin[0], origin[1]);

// fill("black");
// beginShape();
// for (var i = 0; i < this.vertices.length; i++) {
//     var pi = game.translateCoordinate(vertices[i]);
//     vertex(pi[0], pi[1]);
// }
// vertex(game.translateCoordinate(vertices[0])[0], game.translateCoordinate(vertices[0])[1]);
// endShape();
