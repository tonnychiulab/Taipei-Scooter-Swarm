// assets/js/main.js
import { CONFIG } from './config.js';
import { Motorcycle } from './Motorcycle.js';
import { Environment } from './Environment.js';
import { Pedestrian } from './Pedestrian.js';
import { QuadTree, Rectangle } from './QuadTree.js';

const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');

let scooters = [];
let pedestrians = [];
let env = new Environment();
let frameCount = 0;

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupUIControls();
    requestAnimationFrame(gameLoop);
}

function spawnPedestrian() {
    const roadWidth = canvas.width * CONFIG.ROAD_WIDTH_RATIO;
    const roadStartX = (canvas.width - roadWidth) / 2;
    const stopLineY = canvas.height * CONFIG.STOP_LINE_Y;
    const spawnY = stopLineY + 15 + Math.random() * 20; // 對齊斑馬線範圍 (+15 ~ +45)

    let type;
    if (Math.random() < CONFIG.ANNOYING_RATIO) {
        type = 'annoying';
    } else {
        const r = Math.random();
        if (r < 0.33) type = 'elderly';
        else if (r < 0.66) type = 'wheelchair';
        else type = 'normal';
    }

    pedestrians.push(new Pedestrian(roadStartX - 10, spawnY, type));
}

function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    CONFIG.CANVAS_WIDTH = canvas.width;
    CONFIG.CANVAS_HEIGHT = canvas.height;
}

function setupUIControls() {
    // 與之前相同，處理滑桿與按鈕
    ['spawn-rate', 'aggressive-ratio', 'clueless-ratio'].forEach(id => {
        const input = document.getElementById(id);
        const val = document.getElementById(id + '-val');
        input.addEventListener('input', (e) => {
            let v = e.target.value;
            val.textContent = v;
            if (id === 'spawn-rate') CONFIG.SPAWN_RATE = parseInt(v);
            if (id === 'aggressive-ratio') CONFIG.AGGRESSIVE_RATIO = parseInt(v) / 100;
            if (id === 'clueless-ratio') CONFIG.CLUELESS_RATIO = parseInt(v) / 100;
        });
    });

    document.getElementById('btn-auto').addEventListener('click', () => env.setMode('auto'));
    document.getElementById('btn-red').addEventListener('click', () => env.setMode('force-red'));
    document.getElementById('btn-green').addEventListener('click', () => env.setMode('force-green'));

    document.getElementById('btn-lane-auto').addEventListener('click', () => env.setLaneLineMode('auto'));
    document.getElementById('btn-lane-solid').addEventListener('click', () => env.setLaneLineMode('forced-solid'));
    document.getElementById('btn-lane-dashed').addEventListener('click', () => env.setLaneLineMode('forced-dashed'));

    const pedSpawnInput = document.getElementById('ped-spawn-rate');
    const pedSpawnVal = document.getElementById('ped-spawn-rate-val');
    pedSpawnInput.addEventListener('input', (e) => {
        pedSpawnVal.textContent = e.target.value;
        CONFIG.PEDESTRIAN_SPAWN_RATE = parseInt(e.target.value);
    });

    const annoyingInput = document.getElementById('annoying-ratio');
    const annoyingVal = document.getElementById('annoying-ratio-val');
    annoyingInput.addEventListener('input', (e) => {
        annoyingVal.textContent = e.target.value;
        CONFIG.ANNOYING_RATIO = parseInt(e.target.value) / 100;
    });
}

function spawnScooter() {
    const roadWidth = canvas.width * CONFIG.ROAD_WIDTH_RATIO;
    const roadStartX = (canvas.width - roadWidth) / 2;
    const spawnX = roadStartX + Math.random() * roadWidth;
    const spawnY = -20;

    let type = 'normal';
    const rand = Math.random();
    if (rand < CONFIG.AGGRESSIVE_RATIO) type = 'aggressive';
    else if (rand < CONFIG.AGGRESSIVE_RATIO + CONFIG.CLUELESS_RATIO) type = 'clueless';

    scooters.push(new Motorcycle(spawnX, spawnY, type));
}

function drawEnvironment() {
    const roadWidth = canvas.width * CONFIG.ROAD_WIDTH_RATIO;
    const roadStartX = (canvas.width - roadWidth) / 2;
    const roadEndX = roadStartX + roadWidth;
    const stopLineY = canvas.height * CONFIG.STOP_LINE_Y;
    const laneW = roadWidth / CONFIG.LANE_COUNT;

    // 1. 路面
    ctx.fillStyle = '#374151';
    ctx.fillRect(roadStartX, 0, roadWidth, canvas.height);

    // 2. 車道線
    const solid = env.laneLineSolid;
    for (let i = 1; i < CONFIG.LANE_COUNT; i++) {
        const x = roadStartX + laneW * i;
        const isCenter = (i === CONFIG.LANE_COUNT / 2); // 中央分隔

        if (isCenter) {
            // 雙黃線
            ctx.setLineDash([]);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x - 3, 0); ctx.lineTo(x - 3, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 3, 0); ctx.lineTo(x + 3, canvas.height); ctx.stroke();
        } else {
            // 白虛線（或實線）
            ctx.setLineDash(solid ? [] : [14, 10]);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
    }
    ctx.setLineDash([]);

    // 3. 雙白線邊緣
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(roadStartX,     0, 2, canvas.height);
    ctx.fillRect(roadStartX + 5, 0, 2, canvas.height);
    ctx.fillRect(roadEndX - 7,   0, 2, canvas.height);
    ctx.fillRect(roadEndX - 2,   0, 2, canvas.height);

    // 4. 停止線
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(roadStartX, stopLineY, roadWidth, 6);

    // 5. 斑馬線
    ctx.fillStyle = '#d1d5db';
    for (let x = roadStartX + 5; x < roadEndX; x += 20) {
        ctx.fillRect(x, stopLineY + 12, 8, 24);
    }

    // 6. 紅綠燈柱
    ctx.fillStyle = '#1f2937';
    ctx.roundRect(roadStartX - 35, stopLineY - 30, 20, 50, 4);
    ctx.fill();

    const isR = env.lightState === 'red';
    const isY = env.lightState === 'yellow';
    const isG = env.lightState === 'green';

    ctx.fillStyle = isR ? '#ef4444' : '#450a0a';
    if (isR) { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10; }
    ctx.beginPath(); ctx.arc(roadStartX - 25, stopLineY - 20, 5, 0, Math.PI * 2); ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isY ? '#facc15' : '#422006';
    if (isY) { ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10; }
    ctx.beginPath(); ctx.arc(roadStartX - 25, stopLineY - 5, 5, 0, Math.PI * 2); ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isG ? '#22c55e' : '#052e16';
    if (isG) { ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10; }
    ctx.beginPath(); ctx.arc(roadStartX - 25, stopLineY + 10, 5, 0, Math.PI * 2); ctx.fill();

    ctx.shadowBlur = 0;

    // 7. 小綠人燈柱（道路右側，對稱於左側紅綠燈）
    drawWalkingMan(stopLineY, roadEndX);
}

function drawWalkingMan(stopLineY, roadEndX) {
    const state = env.walkingManState;
    const cx = roadEndX + 25;

    // 燈柱底座
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect(cx - 10, stopLineY - 30, 20, 50, 4);
    ctx.fill();

    // 信號燈背景
    ctx.fillStyle = state !== 'stop' ? '#14532d' : '#450a0a';
    ctx.beginPath();
    ctx.roundRect(cx - 8, stopLineY - 28, 16, 34, 3);
    ctx.fill();

    // 閃爍邏輯
    const flash = (state === 'fall' && frameCount % 8 < 4) ||
                  (state === 'run'  && frameCount % 14 < 3);
    if (!flash) {
        _drawWalkingFigure(cx, stopLineY - 11, state);
    }

    // 倒計時秒數
    const secs = env.pedSecondsLeft;
    if (secs > 0) {
        ctx.fillStyle = secs <= 5 ? '#ef4444' : '#4ade80';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(secs, cx, stopLineY + 26);
    }
}

function _drawWalkingFigure(cx, cy, state) {
    ctx.save();
    ctx.translate(cx, cy);

    if (state === 'fall') ctx.rotate(0.65);
    else if (state === 'run') ctx.rotate(-0.18);

    const color = state !== 'stop' ? '#4ade80' : '#ef4444';
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    // 頭
    ctx.beginPath();
    ctx.arc(0, -9, 3, 0, Math.PI * 2);
    ctx.fill();

    // 身體
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 2);
    ctx.stroke();

    if (state === 'stop') {
        // 靜止紅人：雙手平伸，雙腳並攏
        ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(5, -3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-2, 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(2, 9); ctx.stroke();
    } else {
        // 行走動畫：用 frameCount 讓腳擺動
        const speeds  = { slow: 0.08, fast: 0.16, run: 0.26, fall: 0 };
        const spreads = { slow: 3, fast: 5, run: 6, fall: 4 };
        const sp = spreads[state] || 3;
        const phase = state === 'fall' ? 0.6 : Math.sin(frameCount * (speeds[state] || 0.08));

        // 手臂（反向擺）
        ctx.beginPath();
        ctx.moveTo(-5 - phase * sp * 0.4, -4);
        ctx.lineTo( 5 + phase * sp * 0.4, -1);
        ctx.stroke();

        // 腳（交替）
        ctx.beginPath();
        ctx.moveTo(0, 2); ctx.lineTo(-2 + phase * sp, 9); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 2); ctx.lineTo( 2 - phase * sp, 9); ctx.stroke();
    }

    ctx.restore();
}

function gameLoop() {
    ctx.fillStyle = '#111827'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    env.update();
    drawEnvironment();

    const roadWidth = canvas.width * CONFIG.ROAD_WIDTH_RATIO;
    const roadStartX = (canvas.width - roadWidth) / 2;
    const roadEndX = roadStartX + roadWidth;

    // 行人生成節奏：每 (3600 / SPAWN_RATE) 幀生成一人
    const pedSpawnInterval = Math.max(1, Math.floor(3600 / CONFIG.PEDESTRIAN_SPAWN_RATE));
    if (frameCount % pedSpawnInterval === 0) spawnPedestrian();

    // 更新、繪製、消滅行人
    for (let i = pedestrians.length - 1; i >= 0; i--) {
        const ped = pedestrians[i];
        ped.update(scooters, env.lightState, roadEndX, env.walkingManState);
        ped.draw(ctx);
        if (ped.isDone(roadEndX, env.lightState)) {
            pedestrians.splice(i, 1);
        }
    }

    let spawnInterval = Math.max(1, Math.floor(60 / CONFIG.SPAWN_RATE));
    if (frameCount % spawnInterval === 0) spawnScooter();

    const qtree = new QuadTree(new Rectangle(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2));
    scooters.forEach(s => qtree.insert(s));

    for (let i = scooters.length - 1; i >= 0; i--) {
        let scooter = scooters[i];
        scooter.steer(qtree, env.lightState, pedestrians);
        scooter.update();
        scooter.draw(ctx);

        if (scooter.position.y > canvas.height + 30) {
            scooters.splice(i, 1);
        }
    }

    frameCount++;
    requestAnimationFrame(gameLoop);
}

init();