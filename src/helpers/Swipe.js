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
  #threshold = 6; // This came from testing and making sure the touchmove event did not misfire(prevent default error) when horizontal swipe
  #includeMouse = false;
  #start_bound = this.#start.bind(this);
  #end_bound = this.#end.bind(this);
  #move_bound = this.#move.bind(this);
  #preventClickHandler_bound = this.#preventClickHandler.bind(this);
  #preventScroll_bound = this.#preventScroll.bind(this);
  #startEvent = 'touchstart';
  #moveEvent = 'touchmove';
  #endEvent = 'touchend';

  #startX;
  #startY;
  #lastX;
  #lastY;
  #startTime;
  #lastTime;
  #velocity;
  #endX;
  #endY;
  #endTime;
  #deltaDistance;
  #trackVelocityInterval;
  #preventClick;
  #isSwiping = false;


  constructor(element, options = {
    horizontalOnly: false,
    verticalOnly: false,
    velocityThreshold: 0.3,
    distanceThreshold: 10,
    maxTimeMS: 200,
    includeMouse: false,
    disableScroll: false,
    preventClick: false
  }) {
    if (!(element instanceof HTMLElement)) throw Error('HTMLElement required');

    this.#element = element;
    this.#horizontalOnly = !!options.horizontalOnly;
    this.#verticalOnly = !!options.verticalOnly;
    this.#distanceThreshold = options.distanceThreshold || 10;
    this.#velocityThreshold = options.velocityThreshold || 0.3;
    this.#maxTimeMS = options.maxTimeMS || 200;
    this.#disableScroll = options.disableScroll || false;
    this.#includeMouse = options.includeMouse || false;
    this.#preventClick = options.preventClick || false;

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
    if (this.#preventClick) this.#element.addEventListener('click', this.#preventClickHandler_bound, { capture: true, signal: this.#abort.signal });
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


  #preventClickHandler(event) {
    if (this.#isSwiping) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  #preventScroll(event) {
    if (this.#isSwiping) event.preventDefault();
  }


  #start(event) {
    this.#isSwiping = false;
    this.#element.classList.add('swipe-active');
    this.#startX = this.#getClientX(event);
    this.#startY = this.#getClientY(event);
    this.#lastX = this.#startX;
    this.#lastY = this.#startY;
    this.#startTime = Date.now();
    this.#lastTime = Date.now();
    this.#velocity = 0;

    // pointer up does not work in some conditions when mouse moves
    window.addEventListener('mouseup', this.#end_bound, { signal: this.#abort.signal });
    window.addEventListener('touchend', this.#end_bound, { signal: this.#abort.signal });
    window.addEventListener(this.#moveEvent, this.#move_bound, { signal: this.#abort.signal });

    let swipeEvent = new SwipeStartEvent(event, this.#startX, this.#startY);
    const cancelled = !this.#element.dispatchEvent(swipeEvent);
    if (cancelled) {
      this.#element.classList.remove('swipe-active');
      window.removeEventListener('mouseup', this.#end_bound);
      window.removeEventListener('touchend', this.#end_bound);
      window.removeEventListener(this.#moveEvent, this.#move_bound);
      return;
    }

    if (this.#disableScroll) {
      document.body.addEventListener('touchmove', this.#preventScroll_bound, { passive: false, signal: this.#abort.signal });
    }

    this.#trackVelocityInterval = setInterval(this.#trackVelocity.bind(this), 100);
  }

  #end(event) {
    if (this.#trackVelocityInterval) {
      clearInterval(this.#trackVelocityInterval);
      this.#trackVelocityInterval = undefined;
    }
    this.#element.classList.remove('swipe-active');
    window.removeEventListener('mouseup', this.#end_bound);
    window.removeEventListener('touchend', this.#end_bound);
    window.removeEventListener(this.#moveEvent, this.#move_bound);
    this.#endX = this.#getClientX(event);
    this.#endY = this.#getClientY(event);
    this.#endTime = Date.now();
    this.#handleSwipe(event);
    if (this.#disableScroll) {
      document.body.removeEventListener('touchmove', this.#preventScroll_bound);
    }
  }


  #handleSwipe(event) {
    let isSwipe = true;
    let time = this.#endTime - this.#startTime;
    if (time > this.#maxTimeMS) isSwipe = false;

    let dx = this.#endX - this.#startX;
    let dy = this.#endY - this.#startY;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (Math.abs(this.#velocity) < 9) isSwipe = false;

    let radians = Math.atan2(dy, dx);
    let angle = radians * 180 / Math.PI;
    let left = angle >= 135 || angle <= -135;
    let right = angle >= -45 && angle <= 45;
    let up = angle < -45 && angle > -135;
    let down = angle > 45 && angle < 135;
    let direction = left && 'left' || right && 'right' || up && 'up' || down && 'down';

    if (
      distance >= this.#distanceThreshold
      && (
        (this.#verticalOnly && (left || right))
        || (this.#horizontalOnly && (up || down))
      )
    ) {
      isSwipe = false;
    }

    if (isSwipe) {
      let swipeEvent = new SwipeEvent(
        event,
        direction,
        distance,
        this.#velocity
      );
      this.#element.dispatchEvent(swipeEvent);
    }

    let swipeEvent = new SwipeEndEvent(
      event,
      direction,
      distance,
      dx,
      dy,
      this.#velocity,
      isSwipe
    );
    this.#element.dispatchEvent(swipeEvent);
  }

  #move(event) {
    let clientX = this.#getClientX(event);
    let clientY = this.#getClientY(event);
    let dx = clientX - this.#startX;
    let dy = clientY - this.#startY;

    // used to control touchmove preventDefault. If the page is scrolling and we try to preventDefault then an error will through
    // You can see this happen if you raise this.#threshold, the start to drag down till the page scroll a couple pixels, then drag horizontally
    if (this.#isSwiping === false) {
      if (this.#horizontalOnly) {
        if (Math.abs(dy) > this.#threshold) {
          this.#end(event);
          return;
        } else if (Math.abs(dx) > this.#threshold) this.#isSwiping = true;

        // if we are swiping vertically we want to prevent scroll immediately
      } else {
        this.#isSwiping = true;
      }
    }

    let distance = Math.sqrt(dx * dx + dy * dy);
    let deltaDistanceX = clientX - this.#lastX;
    let deltaDistanceY = clientY - this.#lastY;
    this.#lastX = clientX;
    this.#lastY = clientY;
    this.#deltaDistance = Math.sqrt(deltaDistanceX * deltaDistanceX + deltaDistanceY * deltaDistanceY);

    
    // Do not fire move if axis is locked and no movement
    if (this.#horizontalOnly && deltaDistanceX === 0) return;
    else if (this.#verticalOnly && deltaDistanceY === 0) return;

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

  #trackVelocity() {
    const now = Date.now();
    const elapsed = now - this.#lastTime;
    this.#lastTime = now;
    const v = 1000 * this.#deltaDistance / (1 + elapsed);
    this.#velocity = 0.8 * v + 0.2 * this.#velocity;
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
  }
}

class SwipeStartEvent extends PointerEvent {
  constructor(event, clientX, clientY) {
    super('swipestart', {
      bubbles: true,
      cancelable: true,
      changedTouches: event.changedTouches,
      targetTouches: event.targetTouches,
      touches: event.touches,
      clientX,
      clientY
    });
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
  }
}


window.MCSwipe = MCSwipe;
export default MCSwipe;
