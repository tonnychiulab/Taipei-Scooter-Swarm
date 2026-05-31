export class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // 向量相加
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    // 向量相減
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    // 向量乘法 (放大/縮小)
    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    // 向量除法
    div(n) {
        this.x /= n;
        this.y /= n;
        return this;
    }

    // 取得向量長度的平方 (省去開根號的效能消耗，常用於比較距離)
    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    // 取得向量長度
    mag() {
        return Math.sqrt(this.magSq());
    }

    // 將向量長度歸一化 (變成單位向量長度 1)
    normalize() {
        let m = this.mag();
        if (m !== 0) {
            this.div(m);
        }
        return this;
    }

    // 設定向量特定長度
    setMag(n) {
        return this.normalize().mult(n);
    }

    // 限制向量的最大長度 (常用於限制最高車速)
    limit(max) {
        if (this.magSq() > max * max) {
            this.setMag(max);
        }
        return this;
    }

    // 取得向量的角度 (用於繪圖時車頭轉向)
    heading() {
        return Math.atan2(this.y, this.x);
    }

    // 計算兩點距離
    dist(v) {
        let dx = this.x - v.x;
        let dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 靜態方法：回傳一個新的相減向量
    static sub(v1, v2) {
        return new Vector2D(v1.x - v2.x, v1.y - v2.y);
    }

    // 複製向量
    copy() {
        return new Vector2D(this.x, this.y);
    }
}