import { Vector2D } from './Vector2D.js';

export class Pedestrian {
    constructor(x, y, type = 'normal') {
        this.position = new Vector2D(x, y);
        this.startX = x;
        this.type = type;
        this.state = 'waiting';
        this.phoneTimer = 0;

        switch (type) {
            case 'elderly':
                this.speed = 0.5;
                this.radius = 6;
                this.headColor = '#fcd34d';
                this.bodyColor = '#8b5cf6';
                break;
            case 'wheelchair':
                this.speed = 0.4;
                this.radius = 10;
                this.headColor = '#fcd34d';
                this.bodyColor = '#f97316';
                break;
            case 'annoying':
                this.speed = 1.0;
                this.radius = 6;
                this.headColor = '#fca5a5';
                this.bodyColor = '#22c55e';
                break;
            case 'normal':
            default:
                this.speed = 1.2;
                this.radius = 6;
                this.headColor = '#fcd34d';
                this.bodyColor = '#60a5fa';
                break;
        }
    }

    update(scooters, lightState, roadEndX, walkingManState = 'slow') {
        const speedMult = { slow: 1.0, fast: 1.3, run: 1.6, fall: 1.0 }[walkingManState] ?? 1.0;
        const walkSignal = this.type === 'annoying' ? true : (lightState === 'red');

        if (this.type === 'annoying' && Math.random() < 0.005) {
            this.phoneTimer = 60 + Math.floor(Math.random() * 60);
        }

        let danger = false;
        if (this.type !== 'annoying') {
            for (let scooter of scooters) {
                const d = this.position.dist(scooter.position);
                if (d < 60 && scooter.velocity.y > 0.5) {
                    danger = true;
                    break;
                }
            }
        }

        if (walkSignal && !danger) {
            this.state = 'crossing';
        } else {
            this.state = danger ? 'retreating' : 'retreating';
        }

        if (this.state === 'crossing') {
            if (this.phoneTimer > 0) {
                this.phoneTimer--;
            } else {
                this.position.x += this.speed * speedMult;
                if (this.position.x > roadEndX) this.position.x = roadEndX;
            }
        } else if (this.state === 'retreating') {
            const retreatSpeed = (this.type === 'elderly' || this.type === 'wheelchair')
                ? this.speed
                : this.speed * 1.5;
            this.position.x -= retreatSpeed;
            if (this.position.x < this.startX) {
                this.position.x = this.startX;
                this.state = 'waiting';
            }
        }
    }

    isDone(roadEndX, lightState) {
        if (this.position.x >= roadEndX + 20) return true;
        if (this.position.x <= this.startX && lightState === 'green' && this.type !== 'annoying') return true;
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        if (this.type === 'elderly') {
            this._drawElderly(ctx);
        } else if (this.type === 'wheelchair') {
            this._drawWheelchair(ctx);
        } else if (this.type === 'annoying') {
            this._drawAnnoying(ctx);
        } else {
            this._drawNormal(ctx);
        }

        ctx.restore();
    }

    _drawNormal(ctx) {
        ctx.fillStyle = this.state === 'retreating' ? '#fca5a5' : this.headColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(-4, this.radius, 8, 6);
    }

    _drawElderly(ctx) {
        ctx.fillStyle = this.state === 'retreating' ? '#fca5a5' : this.headColor;
        ctx.beginPath();
        ctx.arc(-2, -2, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(-4, this.radius - 2, 7, 6);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(5, 2);
        ctx.lineTo(7, 12);
        ctx.stroke();
    }

    _drawWheelchair(ctx) {
        ctx.fillStyle = this.state === 'retreating' ? '#fca5a5' : this.headColor;
        ctx.beginPath();
        ctx.arc(0, -6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(-3, -1, 6, 6);
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 8, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(8, 10, 2.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawAnnoying(ctx) {
        ctx.fillStyle = this.state === 'retreating' ? '#fca5a5' : this.headColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(-4, this.radius, 8, 6);
        ctx.fillStyle = '#111827';
        ctx.fillRect(3, 2, 5, 8);
        if (this.phoneTimer > 0) {
            ctx.fillStyle = 'rgba(96,165,250,0.8)';
            ctx.fillRect(4, 3, 3, 5);
        }
    }
}
