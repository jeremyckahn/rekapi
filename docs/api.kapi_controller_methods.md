### play

````javascript
/**
 * @param {number=} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.play (opt_howManyTimes)
````

Play the animation on a loop, either a set amount of times or infinitely.  If
`opt_howManyTimes` is omitted, the animation will loop infinitely.

__[Example](examples/play.html)__


### playFrom

````javascript
/**
 * @param {number} millisecond
 * @param {number=} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.playFrom (millisecond, opt_howManyTimes)
````

Move to a specific millisecond on the timeline and play from there.
`opt_howManyTimes` works as it does in `play()`.

__[Example](examples/play_from.html)__


### playFromCurrent

````javascript
/**
 * @param {number=} opt_howManyTimes
 * @returns {Kapi}
 */
Kapi.prototype.playFromCurrent (opt_howManyTimes)
````

Play from the last frame that was drawn with `render()`. `opt_howManyTimes`
works as it does in `play()`.

__[Example](examples/play_from_current.html)__


### pause

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.pause ()
````

Pause the animation.  A "paused" animation can be resumed from where it left
off with `play()`.

__[Example](examples/pause.html)__


### stop

````javascript
/**
 * @returns {Kapi}
 */
Kapi.prototype.stop (alsoClear)
````

Stop the animation.  A "stopped" animation will start from the beginning if
`play()` is called upon it again.

__[Example](examples/stop.html)__
