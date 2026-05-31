// assets/js/ScooterModel.js

export const ScooterModel = {
    // 主渲染入口
    draw(ctx, scooter) {
        ctx.save();
        ctx.translate(scooter.position.x, scooter.position.y);
        // 轉向：讓車頭朝向速度向量的方向
        ctx.rotate(scooter.velocity.heading() - Math.PI / 2); 

        // 共用底盤與車身
        this._drawBase(ctx, scooter);

        // 根據人格加上獨特配件
        if (scooter.type === 'aggressive') {
            this._drawAggressiveFeatures(ctx);
        } else if (scooter.type === 'clueless') {
            this._drawCluelessFeatures(ctx);
        } else {
            this._drawNormalFeatures(ctx);
        }

        ctx.restore();
    },

    // 繪製共用車體
    _drawBase(ctx, scooter) {
        // 車身 (長方形帶圓角)
        ctx.fillStyle = scooter.bodyColor;
        ctx.beginPath();
        ctx.roundRect(-4, -8, 8, 16, 2);
        ctx.fill();

        // 龍頭與把手 (灰色金屬)
        ctx.fillStyle = '#9ca3af'; 
        ctx.fillRect(-6, -6, 12, 2);

        // 騎士安全帽 (圓形)
        ctx.fillStyle = scooter.helmetColor;
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // 擋風鏡 (黑色前視角)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 2, 4, Math.PI, 0);
        ctx.fill();
    },

    // 乖寶寶特徵：偶爾會有外送箱
    _drawNormalFeatures(ctx) {
        // 利用一點隨機值決定有沒有外送箱 (這裡簡化，直接用 id 或座標取隨機)
        // 為了避免每偵閃爍，這裡就不加隨機外送箱了，保持乾淨
    },

    // 鑽車型特徵：改裝排氣管與超亮煞車燈
    _drawAggressiveFeatures(ctx) {
        ctx.fillStyle = '#f59e0b'; // 橘黃色改裝燈
        ctx.beginPath();
        ctx.arc(-3, 8, 1.5, 0, Math.PI * 2);
        ctx.arc(3, 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
    },

    // 三寶特徵：車頭菜籃與忘記關的方向燈
    _drawCluelessFeatures(ctx) {
        // 前方買菜籃
        ctx.fillStyle = '#8b5cf6'; // 紫色籃子
        ctx.fillRect(-3, -10, 6, 3);
        
        // 忘記關的左轉方向燈 (一直閃)
        if (Math.random() > 0.5) {
            ctx.fillStyle = '#fbbf24'; 
            ctx.beginPath();
            ctx.arc(-4, 6, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};