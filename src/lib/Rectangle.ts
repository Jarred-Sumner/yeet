export class Rectangle {
  constructor(x: number, y: number, w: number, h: number) {
    this.left = x;
    this.top = y;
    this.right = x + w;
    this.bottom = y + h;
  }

  left: number;
  top: number;
  right: number;
  bottom: number;

  static fromRectangle({ left, top, right, bottom }) {
    return new Rectangle(left, top, right - left, bottom - top);
  }

  static fromFrame({ x, y, width, height }) {
    return new Rectangle(x, y, width, height);
  }

  get x() {
    return this.left;
  }

  get y() {
    return this.top;
  }

  get width() {
    return this.right - this.left;
  }

  get height() {
    return this.bottom - this.top;
  }

  set x(v) {
    let diff = this.left - v;
    this.left = v;
    this.right -= diff;
  }

  set y(v) {
    let diff = this.top - v;
    this.top = v;
    this.bottom -= diff;
  }

  set width(v) {
    this.right = this.left + v;
  }

  set height(v) {
    this.bottom = this.top + v;
  }

  isEmpty() {
    return this.left >= this.right || this.top >= this.bottom;
  }

  setRectangle(x, y, w, h) {
    this.left = x;
    this.top = y;
    this.right = x + w;
    this.bottom = y + h;

    return this;
  }

  setBounds(l, t, r, b) {
    this.top = t;
    this.left = l;
    this.bottom = b;
    this.right = r;

    return this;
  }

  equals(other) {
    return (
      other != null &&
      ((this.isEmpty() && other.isEmpty()) ||
        (this.top == other.top &&
          this.left == other.left &&
          this.bottom == other.bottom &&
          this.right == other.right))
    );
  }

  clone() {
    return new Rectangle(
      this.left,
      this.top,
      this.right - this.left,
      this.bottom - this.top
    );
  }

  center() {
    if (this.isEmpty()) {
      throw new Error("Empty rectangles do not have centers");
    }
    return {
      x: this.left + (this.right - this.left) / 2,
      y: this.top + (this.bottom - this.top) / 2
    };
  }

  copyFrom({ top, left, bottom, right }) {
    this.top = top;
    this.left = left;
    this.bottom = bottom;
    this.right = right;

    return this;
  }

  translate(x, y) {
    this.left += x;
    this.right += x;
    this.top += y;
    this.bottom += y;

    return this;
  }

  toString() {
    return `[${this.x},${this.y},${this.width},${this.height}]`;
  }

  /** return a new rect that is the union of that one and this one */
  union(other) {
    return this.clone().expandToContain(other);
  }

  contains(other) {
    if (other.isEmpty()) {
      return true;
    }
    if (this.isEmpty()) {
      return false;
    }

    return (
      other.left >= this.left &&
      other.right <= this.right &&
      other.top >= this.top &&
      other.bottom <= this.bottom
    );
  }

  intersect(other) {
    return this.clone().restrictTo(other);
  }

  intersects(other) {
    if (this.isEmpty() || other.isEmpty()) {
      return false;
    }

    let x1 = Math.max(this.left, other.left);
    let x2 = Math.min(this.right, other.right);
    let y1 = Math.max(this.top, other.top);
    let y2 = Math.min(this.bottom, other.bottom);
    return x1 < x2 && y1 < y2;
  }

  /** Restrict area of this rectangle to the intersection of both rectangles. */
  restrictTo(other) {
    if (this.isEmpty() || other.isEmpty()) {
      return this.setRectangle(0, 0, 0, 0);
    }

    let x1 = Math.max(this.left, other.left);
    let x2 = Math.min(this.right, other.right);
    let y1 = Math.max(this.top, other.top);
    let y2 = Math.min(this.bottom, other.bottom);
    // If width or height is 0, the intersection was empty.
    return this.setRectangle(
      x1,
      y1,
      Math.max(0, x2 - x1),
      Math.max(0, y2 - y1)
    );
  }

  /** Expand this rectangle to the union of both rectangles. */
  expandToContain(other) {
    if (this.isEmpty()) {
      return this.copyFrom(other);
    }
    if (other.isEmpty()) {
      return this;
    }

    let l = Math.min(this.left, other.left);
    let r = Math.max(this.right, other.right);
    let t = Math.min(this.top, other.top);
    let b = Math.max(this.bottom, other.bottom);
    return this.setRectangle(l, t, r - l, b - t);
  }

  /**
   * Expands to the smallest rectangle that contains original rectangle and is bounded
   * by lines with integer coefficients.
   */
  expandToIntegers() {
    this.left = Math.floor(this.left);
    this.top = Math.floor(this.top);
    this.right = Math.ceil(this.right);
    this.bottom = Math.ceil(this.bottom);
    return this;
  }

  scale(xscl, yscl) {
    this.left *= xscl;
    this.right *= xscl;
    this.top *= yscl;
    this.bottom *= yscl;
    return this;
  }

  map(f) {
    this.left = f.call(this, this.left);
    this.top = f.call(this, this.top);
    this.right = f.call(this, this.right);
    this.bottom = f.call(this, this.bottom);
    return this;
  }

  /** Ensure this rectangle is inside the other, if possible. Preserves w, h. */
  translateInside({ left, right, top, bottom }) {
    let offsetX = 0;
    if (this.left <= left) {
      offsetX = left - this.left;
    } else if (this.right > right) {
      offsetX = right - this.right;
    }

    let offsetY = 0;
    if (this.top <= top) {
      offsetY = top - this.top;
    } else if (this.bottom > bottom) {
      offsetY = bottom - this.bottom;
    }

    return this.translate(offsetX, offsetY);
  }

  /** Subtract other area from this. Returns array of rects whose union is this-other. */
  subtract(other) {
    let r = new Rectangle(0, 0, 0, 0);
    let result = [];
    other = other.intersect(this);
    if (other.isEmpty()) {
      return [this.clone()];
    }

    // left strip
    r.setBounds(this.left, this.top, other.left, this.bottom);
    if (!r.isEmpty()) {
      result.push(r.clone());
    }
    // inside strip
    r.setBounds(other.left, this.top, other.right, other.top);
    if (!r.isEmpty()) {
      result.push(r.clone());
    }
    r.setBounds(other.left, other.bottom, other.right, this.bottom);
    if (!r.isEmpty()) {
      result.push(r.clone());
    }
    // right strip
    r.setBounds(other.right, this.top, this.right, this.bottom);
    if (!r.isEmpty()) {
      result.push(r.clone());
    }

    return result;
  }

  /**
   * Blends two rectangles together.
   * @param rect Rectangleangle to blend this one with
   * @param scalar Ratio from 0 (returns a clone of this rect) to 1 (clone of rect).
   * @return New blended rectangle.
   */
  blend({ left, top, width, height }, scalar) {
    return new Rectangle(
      this.left + (left - this.left) * scalar,
      this.top + (top - this.top) * scalar,
      this.width + (width - this.width) * scalar,
      this.height + (height - this.height) * scalar
    );
  }

  /**
   * Grows or shrinks the rectangle while keeping the center point.
   * Accepts single multipler, or separate for both axes.
   */
  inflate(xscl, yscl) {
    let xAdj = (this.width * xscl - this.width) / 2;
    let s = arguments.length > 1 ? yscl : xscl;
    let yAdj = (this.height * s - this.height) / 2;
    this.left -= xAdj;
    this.right += xAdj;
    this.top -= yAdj;
    this.bottom += yAdj;
    return this;
  }

  /**
   * Grows or shrinks the rectangle by fixed amount while keeping the center point.
   * Accepts single fixed amount
   */
  inflateFixed(fixed) {
    this.left -= fixed;
    this.right += fixed;
    this.top -= fixed;
    this.bottom += fixed;
    return this;
  }

  get frame() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  rotate(radians) {
    if (this.isEmpty()) {
      return this;
    }
    const cx = this.center().x;
    const cy = this.center().y;

    const points = [
      [this.left, this.top],
      [this.right, this.bottom]
    ];

    const rotatePoint = ([x, y]) => {
      var cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = cos * (x - cx) + sin * (y - cy) + cx,
        ny = cos * (y - cy) - sin * (x - cx) + cy;

      return { x: nx, y: ny };
    };

    const coords = [
      rotatePoint(points[0]).x,
      rotatePoint(points[0]).y,
      rotatePoint(points[1]).x,
      rotatePoint(points[1]).y
    ];

    return new Rectangle(this.x, this.y, this.width, this.height).setBounds(
      coords[0],
      coords[1],
      coords[2],
      coords[3]
    );
  }
}
