/* global game, key */

function keyPressed () {
    if (key === 'S') {
        game.envs.stop = !game.envs.stop;
    }
    if (key === 'U') {
        game.objects[0].vx += 20;
        game.objects[0].vy += 70;
    }
}
