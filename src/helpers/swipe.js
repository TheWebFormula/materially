const directions = [
  'right',
  'down',
  'left',
  'up'
];


export default class Swipe {
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
  #start_bound = this.#start.bind(this);
  #end_bound = this.#end.bind(this);
  #move_bound = this.#move.bind(this);

  #startX;
  #startY;
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
    maxTimeMS: 200
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
  }


  enable() {
    if (this.#enabled) return;
    this.#enabled = true;
    this.#abort = new AbortController();

    this.#element.addEventListener('touchstart', this.#start_bound, { signal: this.#abort.signal });
  }

  disable() {
    if (this.#abort) this.#abort.abort();
    this.#enabled = false;
  }

  destroy() {
    this.disable();
    this.#element = undefined;
  }


  #start(event) {
    this.#element.classList.add('swipe-active');
    this.#startX = event.changedTouches[0].clientX;
    this.#startY = event.changedTouches[0].clientY;
    this.#startTime = Date.now();

    window.addEventListener('touchend', this.#end_bound, { signal: this.#abort.signal });
    window.addEventListener('touchmove', this.#move_bound, { signal: this.#abort.signal });

    let swipeEvent = new SwipeStartEvent(
      event.changedTouches,
      event.targetTouches,
      event.touches
    );
    this.#element.dispatchEvent(swipeEvent);

    if (this.#disableScroll) event.preventDefault();
  }

  #end(event) {
    this.#element.classList.remove('swipe-active');
    window.removeEventListener('touchend', this.#end_bound);
    window.removeEventListener('touchmove', this.#move_bound);
    this.#endX = event.changedTouches[0].clientX;
    this.#endY = event.changedTouches[0].clientY;
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
        event.changedTouches,
        direction,
        distance,
        event.targetTouches,
        event.touches,
        velocity
      );
      this.#element.dispatchEvent(swipeEvent);
    }

    let swipeEvent = new SwipeEndEvent(
      event.changedTouches,
      direction,
      distance,
      dx,
      dy,
      event.targetTouches,
      event.touches,
      velocity,
      isSwipe
    );
    this.#element.dispatchEvent(swipeEvent);
  }

  #move(event) {
    let dx = event.changedTouches[0].clientX - this.#startX;
    let dy = event.changedTouches[0].clientY - this.#startY;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (this.#horizontalOnly && (Math.abs(dy) > this.#horizontalScrollThreshold || Math.abs(dx) < this.#moveStartThreshold)) {
      this.#end(event);
      return;
    }
    
    let swipeEvent = new SwipeMoveEvent(
      event.changedTouches,
      distance,
      dx,
      dy,
      event.targetTouches,
      event.touches
    );
    this.#element.dispatchEvent(swipeEvent);
  }
}

class SwipeEvent extends TouchEvent {
  constructor(changedTouches, direction, distance, targetTouches, touches, velocity) {
    super('swipe', {
      bubbles: true,
      changedTouches,
      targetTouches,
      touches
    });

    this.direction = direction;
    this.distance = distance;
    this.velocity = velocity;
  }
}

class SwipeMoveEvent extends TouchEvent {
  constructor(changedTouches, distance, distanceX, distanceY, targetTouches, touches) {
    super('swipemove', {
      bubbles: true,
      changedTouches,
      targetTouches,
      touches
    });

    this.distance = distance;
    this.distanceX = distanceX;
    this.distanceY = distanceY;
  }
}

class SwipeStartEvent extends TouchEvent {
  constructor(changedTouches, targetTouches, touches) {
    super('swipestart', {
      bubbles: true,
      changedTouches,
      targetTouches,
      touches
    });
  }
}

class SwipeEndEvent extends TouchEvent {
  constructor(changedTouches, direction, distance, distanceX, distanceY, targetTouches, touches, velocity, isSwipe) {
    super('swipeend', {
      bubbles: true,
      changedTouches,
      targetTouches,
      touches
    });

    this.direction = direction;
    this.distance = distance;
    this.distanceX = distanceX;
    this.distanceY = distanceY;
    this.velocity = velocity;
    this.swipe = isSwipe;
  }
}
