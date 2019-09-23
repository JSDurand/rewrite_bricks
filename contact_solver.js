/* global game */

// TODO: add contact solvers

// The contact solver is supposed to be simple: after the collision detection finds two
// polygons are colliding, the contact solver receives the contact normal and the contact
// constant. Then the contact solver pushes the two polygons, or one polygon and one
// plane, away from each other, proportional to the inverses of their masses. Now I have
// to think of a way for the collision detection algorithm to not only return the time of
// impact, but also the contact normal and the contact constant.

game.contact_solver = function () {
};
