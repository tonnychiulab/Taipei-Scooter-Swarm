// 軸對齊矩形，用中心點 + 半寬高描述，方便做相交測試
export class Rectangle {
    constructor(x, y, w, h) {
        this.x = x; // center x
        this.y = y; // center y
        this.w = w; // half-width
        this.h = h; // half-height
    }

    contains(pos) {
        return pos.x >= this.x - this.w && pos.x <= this.x + this.w &&
               pos.y >= this.y - this.h && pos.y <= this.y + this.h;
    }

    intersects(range) {
        return !(range.x - range.w > this.x + this.w ||
                 range.x + range.w < this.x - this.w ||
                 range.y - range.h > this.y + this.h ||
                 range.y + range.h < this.y - this.h);
    }
}

export class QuadTree {
    constructor(boundary, capacity = 8) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.entities = [];
        this.divided = false;
    }

    insert(entity) {
        if (!this.boundary.contains(entity.position)) return false;
        if (this.entities.length < this.capacity) {
            this.entities.push(entity);
            return true;
        }
        if (!this.divided) this._subdivide();
        return this.ne.insert(entity) || this.nw.insert(entity) ||
               this.se.insert(entity) || this.sw.insert(entity);
    }

    query(range, found = []) {
        if (!this.boundary.intersects(range)) return found;
        for (let e of this.entities) {
            if (range.contains(e.position)) found.push(e);
        }
        if (this.divided) {
            this.ne.query(range, found);
            this.nw.query(range, found);
            this.se.query(range, found);
            this.sw.query(range, found);
        }
        return found;
    }

    _subdivide() {
        const { x, y, w, h } = this.boundary;
        const hw = w / 2, hh = h / 2;
        this.ne = new QuadTree(new Rectangle(x + hw, y - hh, hw, hh), this.capacity);
        this.nw = new QuadTree(new Rectangle(x - hw, y - hh, hw, hh), this.capacity);
        this.se = new QuadTree(new Rectangle(x + hw, y + hh, hw, hh), this.capacity);
        this.sw = new QuadTree(new Rectangle(x - hw, y + hh, hw, hh), this.capacity);
        this.divided = true;
    }
}
