# This is an attempt to rewrite the bricks game, this time adding the rotating bricks.

## Problem
The problem with the rotating bricks is that I want a method to detect continuous
collisions, but it is quite difficult to do it properly. And the most of the engines
publicly available just use discrete methods to approximate the situation, which from my
point of view is not satisfactory enough.

# How to play
This is currently at very early stage. Don't expect anything playable for the present.

# Possible improvements
Since this only uses an external library for drawing, a lot of basic functions are not
optimised, e.g. the matrix operations, vector manipulations, etc. We might use the
glMatrix library to improve the performance for example.

Also my own implementation of the GJK algorithm is possibly not very well-written, so that
is a possible cause of bad performance, if it occurs.


# Credit
I use the library p5 for drawing.

Thanks to everyone's support. :-)
