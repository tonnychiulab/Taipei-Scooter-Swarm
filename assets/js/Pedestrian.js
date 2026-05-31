// assets/js/Pedestrian.js
import { Vector2D } from './Vector2D.js';
import { CONFIG } from './config.js';

export class Pedestrian {
    constructor(x, y) {
        this.position = new Vector2D(x, y);
        this.startX = x;
        this.speed = 1.2;
        this.state = 'waiting'; // waiting, crossing, retreating
        this.radius = 6;
    }

    update(scooters, lightState, roadEndX) {
        // 行人號誌與車輛相反
        let walkSignal = (lightState === 'red'); 

        // 偵測來車 (生死一瞬間)
        let danger = false;
        for (let scooter of scooters) {
            let d = this.position.dist(scooter.position);
            // 如果機車距離小於 60，且正在往下衝
            if (d < 60 && scooter.velocity.y > 0.5) {
                danger = true;
                break;
            }
        }

        if (walkSignal) {
            if (danger) {
                this.state = 'retreating';
            } else {
                this.state = 'crossing';
            }
        } else {
            // 變綠燈了，趕快退回起點
            this.state = 'retreating'; 
        }

        // 行走邏輯
        if (this.state === 'crossing') {
            this.position.x += this.speed;
            if (this.position.x > roadEndX) this.position.x = roadEndX; // 過完馬路
        } else if (this.state === 'retreating') {
            this.position.x -= this.speed * 1.5; // 逃命跑比較快
            if (this.position.x < this.startX) this.position.x = this.startX; // 回到安全島
            if (this.position.x === this.startX) this.state = 'waiting';
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.state === 'retreating' ? '#fca5a5' : '#fcd34d'; // 害怕時變粉紅，正常是膚色
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 畫身體
        ctx.fillStyle = '#60a5fa'; // 藍色衣服
        ctx.fillRect(this.position.x - 4, this.position.y + 2, 8, 6);
    }
}