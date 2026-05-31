// assets/js/Motorcycle.js
import { Vector2D } from './Vector2D.js';
import { CONFIG } from './config.js';
import { ScooterModel } from './ScooterModel.js';
import { Rectangle } from './QuadTree.js';

export class Motorcycle {
    constructor(x, y, type = 'normal') {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, Math.random() * 2 + 1);
        this.acceleration = new Vector2D(0, 0);
        this.type = type;
        this.radius = CONFIG.SCOOTER_RADIUS * 1.2;
        
        this.distractionTimer = 0; 
        this.wobbleOffset = Math.random() * 1000; 

        // 顏色配置保留在這裡，當作資料傳給渲染器
        switch(this.type) {
            case 'aggressive':
                this.maxSpeed = CONFIG.MAX_SPEED * 1.6;
                this.maxForce = CONFIG.MAX_FORCE * 2.0;
                this.helmetColor = '#ef4444'; 
                this.bodyColor = '#1f2937';   
                this.separationWeight = 0.4;  
                break;
            case 'clueless':
                this.maxSpeed = CONFIG.MAX_SPEED * 0.7;
                this.maxForce = CONFIG.MAX_FORCE * 0.4; 
                this.helmetColor = '#a855f7'; 
                this.bodyColor = '#fbcfe8';   
                this.separationWeight = 3.0;
                break;
            case 'normal':
            default:
                this.maxSpeed = CONFIG.MAX_SPEED;
                this.maxForce = CONFIG.MAX_FORCE;
                this.helmetColor = '#ffffff'; 
                this.bodyColor = '#3b82f6';   
                this.separationWeight = 1.2;
                break;
        }
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    steer(qtree, lightState, pedestrians) {
        let separation = this.separate(qtree);
        let seek = this.seekTarget(lightState);
        let avoidPed = this.avoidPedestrians(pedestrians);

        separation.mult(this.separationWeight);
        avoidPed.mult(this.type === 'aggressive' ? 0.5 : 2.5);

        if (this.type === 'clueless') {
            if (lightState === 'green' && this.velocity.mag() < 0.5) {
                if (Math.random() < 0.02) this.distractionTimer = 60; 
            }
            if (this.distractionTimer > 0) {
                seek.mult(0); 
                this.distractionTimer--;
            }
            this.wobbleOffset += 0.05;
            let wobbleForce = new Vector2D(Math.sin(this.wobbleOffset) * 0.8, 0);
            this.applyForce(wobbleForce);
        }

        if (this.type === 'aggressive' && this.velocity.mag() < this.maxSpeed * 0.5) {
            let squeezeForce = new Vector2D((Math.random() > 0.5 ? 1 : -1) * this.maxForce * 1.5, 0);
            this.applyForce(squeezeForce);
        }

        this.applyForce(separation);
        this.applyForce(seek);
        this.applyForce(avoidPed);
    }

    avoidPedestrians(pedestrians) {
        let steer = new Vector2D(0, 0);
        for (let p of pedestrians) {
            const avoidDist = p.type === 'wheelchair' ? 80 : 40;
            let d = this.position.dist(p.position);
            if (d < avoidDist) {
                let diff = Vector2D.sub(this.position, p.position);
                diff.normalize().div(d);
                steer.add(diff);
            }
        }
        if (steer.magSq() > 0) {
            steer.normalize().mult(this.maxSpeed).sub(this.velocity).limit(this.maxForce * 2);
        }
        return steer;
    }

    separate(qtree) {
        let steer = new Vector2D(0, 0);
        let count = 0;
        let desiredSeparation = (this.type === 'aggressive') ? CONFIG.SEPARATION_DIST * 0.4 : CONFIG.SEPARATION_DIST;

        const range = new Rectangle(this.position.x, this.position.y, desiredSeparation, desiredSeparation);
        const neighbors = qtree.query(range);

        for (let other of neighbors) {
            let d = this.position.dist(other.position);
            if (d > 0 && d < desiredSeparation) {
                let diff = Vector2D.sub(this.position, other.position);
                diff.normalize().div(d);
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) steer.div(count);
        if (steer.magSq() > 0) {
            steer.normalize().mult(this.maxSpeed).sub(this.velocity).limit(this.maxForce);
        }
        return steer;
    }

    seekTarget(lightState) {
        const stopLineY = CONFIG.CANVAS_HEIGHT * CONFIG.STOP_LINE_Y;
        let distToStop = stopLineY - this.position.y;
        let shouldStop = false;
        
        if (distToStop > -20 && distToStop < 180) { 
            if (lightState === 'red') {
                shouldStop = true;
                if (this.type === 'aggressive' && distToStop < 50 && this.velocity.mag() > this.maxSpeed * 0.7) {
                    shouldStop = false;
                }
            } else if (lightState === 'yellow') {
                if (this.type === 'aggressive') {
                    shouldStop = false; 
                } else if (this.type === 'clueless') {
                    shouldStop = true;  
                } else {
                    shouldStop = distToStop > 80; 
                }
            }
        }

        if (shouldStop) {
            let desiredSpeed = Math.max(0, (distToStop / 150) * this.maxSpeed);
            if (distToStop < 10 && this.velocity.mag() < 0.5) desiredSpeed = 0; 
            
            let desiredVelocity = new Vector2D(0, desiredSpeed);
            let steer = Vector2D.sub(desiredVelocity, this.velocity);
            let brakeForce = this.type === 'clueless' ? this.maxForce * 0.8 : this.maxForce * 2;
            steer.limit(brakeForce);
            return steer;
        }

        let desired = new Vector2D(0, this.maxSpeed);
        if (lightState === 'yellow' && !shouldStop && this.type === 'aggressive') {
            desired.mult(1.2);
        }
        
        let steer = Vector2D.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        return steer;
    }

    update() {
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0); 
        this.checkEdges();
    }

    checkEdges() {
        let roadWidth = CONFIG.CANVAS_WIDTH * CONFIG.ROAD_WIDTH_RATIO;
        let roadStartX = (CONFIG.CANVAS_WIDTH - roadWidth) / 2;
        let roadEndX = roadStartX + roadWidth;

        if (this.position.x < roadStartX + this.radius) {
            this.position.x = roadStartX + this.radius;
            this.velocity.x *= -0.3;
        } else if (this.position.x > roadEndX - this.radius) {
            this.position.x = roadEndX - this.radius;
            this.velocity.x *= -0.3;
        }
    }

    // 2. 繪圖邏輯瘦身：直接丟給渲染引擎！
    draw(ctx) {
        ScooterModel.draw(ctx, this);
    }
}