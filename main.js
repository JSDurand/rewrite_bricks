// Rewrite the good old bricks game
/* global game frameRate angleMode DEGREES createCanvas windowWidth windowHeight width height textSize */

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
    game.envs.gravity = {x:0, y:-6};
    game.envs.life    = 10;
    game.envs.level   = 1;
    textSize(40);
    game.add_brick(null, null, null, null, null, "blue");
    game.add_brick(-100, 0, null, null, null, "blue", null, 10, 0);
    
    // game.envs.mysize = width/10;
    // game.envs.diff = height/10;
    // game.envs.vshift = height/3 - game.constants.defaultWidth/2;
    // game.envs.hshift = width/3 - game.constants.defaultHeight/2;
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
