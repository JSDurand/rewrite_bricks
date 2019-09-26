/* global game, key */

function keyPressed () {
    if (key === 'S') {
        game.envs.stop = !game.envs.stop;
    }
    if (key === 'U') {
        var velocity = game.unit_normal([game.objects[0].c_x, game.objects[0].c_y]);
        game.objects[0].vx -= 20 * velocity[0];
        game.objects[0].vy -= 20 * velocity[1];
    }
    if (key === 'L') {
        game.objects[0].vx /= 2;
        game.objects[0].vy /= 1.1;
    }
}
