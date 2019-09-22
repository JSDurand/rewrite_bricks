/* global game frameRate angleMode DEGREES createCanvas windowWidth windowHeight width height textSize, test_polygon2, test_polygon1 */
// Rewrite the good old bricks game

game      = {};
game.envs = {};

function setup () {
    frameRate(1);
    angleMode(DEGREES);
    game.can          = createCanvas(windowWidth, windowHeight);
    game.centerCanvas();
    game.can.background(0);
    game.envs.width   = width;
    game.envs.height  = height;
    game.envs.origin  = {x: game.envs.width/2,
                         y: game.envs.height / 2};
    game.envs.stop    = false;
    game.envs.gravity = {x:0, y:-6};
    game.envs.life    = 10;
    game.envs.level   = 1;
    game.envs.id      = 0;
    game.envs.time    = 0;
    textSize(40);
    game.add_brick({color: "blue", w: -45, vx: -20,
                    vertices: [[-40, -40],
                               [40, -40],
                               [40, 40],
                               [-40, 40]]});
    game.add_brick({color: "red", vy: -100, w: 30, vx: -100,
                    vertices: [[100, 20],
                               [120, 50],
                               [90, 70],
                               [70, 40]]});
    // game.add_brick({color: "red", vx: 0,
    //                 vertices: [[5, -25],
    //                            [25, 5],
    //                            [-5, 25],
    //                            [-25, -5]]});
    game.update();

    // for testing
    test_polygon1 = function (time) {return game.simulate_time(game.objects[0], time);};
    test_polygon2 = function (time) {return game.simulate_time(game.objects[1], time);};

    // var obj = game.gjk(game.objects[0], game.objects[1]);

    // ellipse(game.translateCoordinate(obj.first)[0], game.translateCoordinate(obj.first)[1], 5, 5);
    // ellipse(game.translateCoordinate(obj.second)[0], game.translateCoordinate(obj.second)[1], 5, 5);
    // game.envs.mysize = width/10;
    // game.envs.diff = height/10;
    // game.envs.vshift = height/3 - game.constants.defaultWidth/2;
    // game.envs.hshift = width/3 - game.constants.defaultHeight/2;
}

function draw() {
    // game.update();
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
