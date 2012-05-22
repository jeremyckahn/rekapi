# Upgrading to Rekapi 0.8.0

The API changed a bit for 0.8.0, as a result of issue #9.  Upgrading shouldn't
be too difficult, there are just a few changes you need to make to use it.

## Canvas animations

  1.  You need replace `Kapi.Actor` with `Kapi.CanvasActor`.
  2.  `Kapi.prototype.canvas_style` no longer exists.
  3.  All methods that began with `canvas_` are now camelCase.

## DOM animations

  1.  You don't need to have a container element or pass anything into the
  `Kapi` constructor.  No changes are made to the Actor DOM element's parent.

