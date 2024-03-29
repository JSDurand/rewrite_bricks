/* global game frameRate angleMode DEGREES createCanvas windowWidth windowHeight width height textSize, test_polygon2, test_polygon1 */
// Rewrite the good old bricks game

game      = {};
game.envs = {};

function setup () {
    frameRate(20);
    angleMode(DEGREES);
    game.can          = createCanvas(windowWidth, windowHeight);
    game.centerCanvas();
    game.can.background(0);
    game.envs.width   = width;
    game.envs.height  = height;
    game.envs.origin  = {x: game.envs.width/2,
                         y: game.envs.height / 2};
    game.envs.stop    = false;
    game.envs.gravity = {x:0, y:-0.3};
    game.envs.life    = 10;
    game.envs.level   = 1;
    game.envs.id      = 0;
    game.envs.time    = 0;
    game.envs.max_vel = 75;
    textSize(40);

    // For constraint solving
    game.envs.constraint_solvers = [];

    // For contact solving
    game.envs.contact_solvers = [];

    // some brick for testing
    game.add_brick({color: "gold", center: {x: 60, y: 0}, width: 40, height: 40, angle: 30});
    game.add_brick({color: "gold", center: {x: 60, y: 60}, width: 40, height: 40});
    // game.add_brick({color: "gold", center: {x: 30, y: 51.96}, width: 40, height: 40});
    // game.add_brick({color: "gold", center: {x: 0, y: 103.92}, width: 40, height: 40});
    // game.add_brick({color: "gold", center: {x: 60, y: 103.92}, width: 40, height: 40});
    // game.add_brick({color: "gold", center: {x: 0, y: 30}, width: 20, height: 20});
    // game.add_brick({color: "gold", center: {x: 60, y: -60}, width: 20, height: 20});
    // game.add_brick({color: "red", center: {x: -50, y: -80}, width: 20, height: 20});

    // var fake_brick = game.add_brick({fake: true});

    // var solver0 = game.make_joint_solver(game.objects[0], game.objects[1], 60, 0.5),
    //     solver1 = game.make_joint_solver(game.objects[1], game.objects[2], 60, 0.5),
    //     solver2 = game.make_joint_solver(game.objects[2], game.objects[0], 60, 0.5),
    //     solver3 = game.make_joint_solver(game.objects[2], game.objects[3], 60, 0.5),
    //     solver4 = game.make_joint_solver(game.objects[3], game.objects[4], 60, 0.5),
    //     solver5 = game.make_joint_solver(game.objects[4], game.objects[2], 60, 0.5),
    //     solver6 = game.make_joint_solver(game.objects[1], game.objects[4], 103.92, 0.5),
    //     solver7 = game.make_joint_solver(game.objects[0], game.objects[3], 103.92, 0.5);
        // solver8 = game.make_motor_constraint(game.objects[0], 10);

    // game.envs.constraint_solvers.push(solver0);
    // game.envs.constraint_solvers.push(solver1);
    // game.envs.constraint_solvers.push(solver2);
    // game.envs.constraint_solvers.push(solver3);
    // game.envs.constraint_solvers.push(solver4);
    // game.envs.constraint_solvers.push(solver5);
    // game.envs.constraint_solvers.push(solver6);
    // game.envs.constraint_solvers.push(solver7);
    // game.envs.constraint_solvers.push(solver8);
    
    game.update();
}

function draw() {
    game.update();
    // if (game.envs.intro) {
    //   startInterface();
    // } else if (game.envs.bricks.length == 0) {
    //   if (!game.envs.start) {
    //     winner();
    //   } else if (!game.envs.maxAttained) {
    //     nextLevel();
    //   } else {
    //     allPass();
    //   }
    // } else if (game.player.life <= 0) {
    //   death();
    // } else {
    //   gameLoop();
    // }
}

game.centerCanvas = function () {
    var x = (windowWidth  - width) /2;
    var y = (windowHeight - height)/2;
    game.can.position(x, y);
};

function windowResized () {
  game.centerCanvas();
}

// ARCHIVE
// Elliptic pendulum

// game.objects[0].constraint_solver[0].solve = function () {
//     var bodyA = this.bodyA,
//         cxA   = bodyA.c_x,
//         cyA   = bodyA.c_y,
//         bodyB = this.bodyB,
//         cxB   = bodyB.c_x,
//         cyB   = bodyB.c_y,
//         cx    = cxB - cxA,
//         cy    = cyB - cyA;

//     var tentative_velocity = [bodyB.vx - bodyA.vx, bodyB.vy - bodyA.vy],
//         jacobian           = [cx / 10, cy / 5],
//         effective_mass     = 1 / game.sq_len_vec(jacobian),
//         bias_factor        = 0.95,
//         constraint         = Math.abs(cx * cx / 10 + cy * cy / 5 - 1) / 2,
//         lambda             = -1 * effective_mass * (game.dot_prod(jacobian, tentative_velocity) + bias_factor * constraint),
//         impulse            = game.scalar_vec(lambda, jacobian);

//     this.bodyB.vx += impulse[0];
//     this.bodyB.vy += impulse[1];
// };

// game.objects[1].constraint_solver[0]       = new game.constraint_solver();
// game.objects[1].constraint_solver[0].bodyB = game.objects[1];
// game.objects[1].constraint_solver[0].bodyA = game.objects[0];
// game.objects[1].constraint_solver[0].solve = function () {
//     var bodyA = this.bodyA,
//         cxA   = bodyA.c_x,
//         cyA   = bodyA.c_y,
//         bodyB = this.bodyB,
//         cxB   = bodyB.c_x,
//         cyB   = bodyB.c_y,
//         cx    = cxB - cxA,
//         cy    = cyB - cyA;

//     var tentative_velocity = [bodyB.vx - bodyA.vx, bodyB.vy - bodyA.vy],
//         jacobian           = [cx / 10, cy / 5],
//         effective_mass     = 1 / game.sq_len_vec(jacobian),
//         bias_factor        = 0.95,
//         constraint         = Math.abs(cx * cx / 10 + cy * cy / 5 - 1) / 2,
//         lambda             = -1 * effective_mass * (game.dot_prod(jacobian, tentative_velocity) + bias_factor * constraint),
//         impulse            = game.scalar_vec(lambda, jacobian);

//     this.bodyB.vx += impulse[0];
//     this.bodyB.vy += impulse[1];
// };
