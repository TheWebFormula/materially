const MCSwipe = class MCSwipe {
  #abort;
  #enabled = false;
  #element;
  #disableScroll = false;
  #horizontalOnly = false;
  #verticalOnly = false;
  #velocityThreshold = 0.3;
  #distanceThreshold = 10;
  #maxTimeMS = 200;
  #moveStartThreshold = 10;
  #horizontalScrollThreshold = 20;
  #includeMouse = false;
  #start_bound = this.#start.bind(this);
  #end_bound = this.#end.bind(this);
  #move_bound = this.#move.bind(this);
  #startEvent = 'touchstart';
  #moveEvent = 'touchmove';
  #endEvent = 'touchend';

  #startX;
  #startY;
  #lastX;
  #lastY;
  #startTime;
  #endX;
  #endY;
  #endTime;


  constructor(element, options = {
    horizontalOnly: false,
    verticalOnly: false,
    velocityThreshold: 0.3,
    distanceThreshold: 10,
    moveStartThreshold: 10,
    horizontalScrollThreshold: 20,
    maxTimeMS: 200,
    includeMouse: false,
    disableScroll: false
  }) {
    if (!(element instanceof HTMLElement)) throw Error('HTMLElement required');

    this.#element = element;
    this.#horizontalOnly = !!options.horizontalOnly;
    this.#verticalOnly = !!options.verticalOnly;
    this.#distanceThreshold = options.distanceThreshold || 10;
    this.#velocityThreshold = options.velocityThreshold || 0.3;
    this.#maxTimeMS = options.maxTimeMS || 200;
    this.#disableScroll = options.disableScroll || false;
    this.#moveStartThreshold = options.moveStartThreshold || 10;
    this.#horizontalScrollThreshold = options.horizontalScrollThreshold || 20;
    this.#includeMouse = options.includeMouse || false;

    if (this.#includeMouse) {
      this.#startEvent = 'pointerdown';
      this.#moveEvent = 'pointermove';
      this.#endEvent = 'pointerup';
    }
  }

  get disableScroll() { return this.#disableScroll; }
  set disableScroll(value) {
    this.#disableScroll = !!value;
  }


  enable() {
    if (this.#enabled) return;
    this.#enabled = true;
    this.#abort = new AbortController();
    this.#element.addEventListener(this.#startEvent, this.#start_bound, { signal: this.#abort.signal });
  }

  disable() {
    if (this.#abort) this.#abort.abort();
    this.#enabled = false;
  }

  destroy() {
    this.disable();
    this.#element = undefined;
  }

  #getClientX(event) {
    return event.changedTouches && event.changedTouches[0] ? event.changedTouches[0].clientX : event.clientX;
  }

  #getClientY(event) {
    return event.changedTouches && event.changedTouches[0] ? event.changedTouches[0].clientY : event.clientY;
  }


  #start(event) {
    this.#element.classList.add('swipe-active');
    this.#startX = this.#getClientX(event);
    this.#startY = this.#getClientY(event);
    this.#lastX = this.#startX;
    this.#lastY = this.#startY;
    this.#startTime = Date.now();
    window.addEventListener(this.#endEvent, this.#end_bound, { signal: this.#abort.signal });
    window.addEventListener(this.#moveEvent, this.#move_bound, { signal: this.#abort.signal });

    let swipeEvent = new SwipeStartEvent(event);
    this.#element.dispatchEvent(swipeEvent);

    if (this.#disableScroll) event.preventDefault();
  }

  #end(event) {
    this.#element.classList.remove('swipe-active');
    window.removeEventListener(this.#endEvent, this.#end_bound);
    window.removeEventListener(this.#moveEvent, this.#move_bound);
    this.#endX = this.#getClientX(event);
    this.#endY = this.#getClientY(event);
    this.#endTime = Date.now();
    this.#handleSwipe(event);
  }


  #handleSwipe(event) {
    let isSwipe = true;
    let time = this.#endTime - this.#startTime;
    if (time > this.#maxTimeMS) isSwipe = false;

    let dx = this.#endX - this.#startX;
    let dy = this.#endY - this.#startY;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < this.#distanceThreshold) return;

    let velocity = distance / time;
    if (Math.abs(velocity) < this.#velocityThreshold) isSwipe = false;

    let radians = Math.atan2(dy, dx);
    let angle = radians * 180 / Math.PI;
    let left = angle >= 135 || angle <= -135;
    let right = angle >= -45 && angle <= 45;
    let up = angle < -45 && angle > -135;
    let down = angle > 45 && angle < 135;
    let direction = left && 'left' || right && 'right' || up && 'up' || down && 'down';

    if (
      (this.#verticalOnly && (left || right))
      || (this.#horizontalOnly && (up || down))
    ) {
      isSwipe = false;
    }

    if (isSwipe) {
      let swipeEvent = new SwipeEvent(
        event,
        direction,
        distance,
        velocity
      );
      this.#element.dispatchEvent(swipeEvent);
    }

    let swipeEvent = new SwipeEndEvent(
      event,
      direction,
      distance,
      dx,
      dy,
      velocity,
      isSwipe
    );
    this.#element.dispatchEvent(swipeEvent);
  }

  #move(event) {
    let clientX = this.#getClientX(event);
    let clientY = this.#getClientY(event);
    let dx = clientX - this.#startX;
    let dy = clientY - this.#startY;

    // end if user is scrolling
    if (this.#horizontalOnly && Math.abs(dy) > this.#horizontalScrollThreshold && Math.abs(dx) < this.#moveStartThreshold) {
      this.#end(event);
      return;
    }

    let distance = Math.sqrt(dx * dx + dy * dy);
    let deltaDistanceX = clientX - this.#lastX;
    let deltaDistanceY = clientY - this.#lastY;
    this.#lastX = clientX;
    this.#lastY = clientY;
    let swipeEvent = new SwipeMoveEvent(
      event,
      distance,
      dx,
      dy,
      deltaDistanceX,
      deltaDistanceY
    );
    this.#element.dispatchEvent(swipeEvent);
  }
}

class SwipeEvent extends PointerEvent {
  constructor(event, direction, distance, velocity) {
    super('swipe', {
      bubbles: true,
      changedTouches: event.changedTouches,
      targetTouches: event.targetTouches,
      touches: event.touches
    });

    this.direction = direction;
    this.distance = distance;
    this.velocity = velocity;
    this.clientX = event.clientX;
    this.clientY = event.clientY;
  }
}

class SwipeMoveEvent extends PointerEvent {
  constructor(event, distance, distanceX, distanceY, deltaDistanceX, deltaDistanceY) {
    super('swipemove', {
      bubbles: true,
      changedTouches: event.changedTouches,
      targetTouches: event.targetTouches,
      touches: event.touches
    });

    this.distance = distance;
    this.distanceX = distanceX;
    this.distanceY = distanceY;
    this.deltaDistanceX = deltaDistanceX;
    this.deltaDistanceY = deltaDistanceY;
    this.directionX = distanceX === 0 ? 0 : distanceX > 0 ? 1 : -1;
    this.directionY = distanceY === 0 ? 0 : distanceY > 0 ? 1 : -1;
    this.clientX = event.clientX;
    this.clientY = event.clientY;
  }
}

class SwipeStartEvent extends PointerEvent {
  constructor(event) {
    super('swipestart', {
      bubbles: true,
      changedTouches: event.changedTouches,
      targetTouches: event.targetTouches,
      touches: event.touches
    });

    this.clientX = event.clientX;
    this.clientY = event.clientY;
  }
}

class SwipeEndEvent extends PointerEvent {
  constructor(event, direction, distance, distanceX, distanceY, velocity, isSwipe) {
    super('swipeend', {
      bubbles: true,
      changedTouches: event.changedTouches,
      targetTouches: event.targetTouches,
      touches: event.touches
    });

    this.direction = direction;
    this.distance = distance;
    this.distanceX = distanceX;
    this.distanceY = distanceY;
    this.directionX = distanceX === 0 ? 0 : distanceX > 0 ? 1 : -1;
    this.directionY = distanceY === 0 ? 0 : distanceY > 0 ? 1 : -1;
    this.velocity = velocity;
    this.swipe = isSwipe;
    this.clientX = event.clientX;
    this.clientY = event.clientY;
  }
}


window.MCSwipe = MCSwipe;
export default MCSwipe;
