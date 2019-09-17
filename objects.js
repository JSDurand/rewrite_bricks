/* global game */

game.objects = [];

// clone function, taken from A.Levy's nice answer
// The link is https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
game.clone = function (obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = game.clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            // if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            copy[attr] = game.clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};
