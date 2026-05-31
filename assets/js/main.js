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
    
    // 初始化一個行人
    initPedestrians();

    requestAnimationFrame(gameLoop);
}

function initPedestrians() {
    const roadWidth = canvas.width * CONFIG.ROAD_WIDTH_RATIO;
    const roadStartX = (canvas.width - roadWidth) / 2;
    const stopLineY = canvas.height * CONFIG.STOP_LINE_Y;
    
    // 將行人放在道路左側邊緣，斑馬線上
    pedestrians.push(new Pedestrian(roadStartX - 10, stopLineY + 25));
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
    
    // 1. 畫柏油路
    ctx.fillStyle = '#374151'; 
    ctx.fillRect(roadStartX, 0, roadWidth, canvas.height);

    // 2. 畫停止線
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(roadStartX, stopLineY, roadWidth, 8);

    // 3. 畫斑馬線 (Zebra Crossing)
    ctx.fillStyle = '#e5e7eb'; // 淺灰白
    for (let x = roadStartX + 5; x < roadEndX; x += 25) {
        ctx.fillRect(x, stopLineY + 15, 10, 30);
    }

    // 4. 畫實體三色紅綠燈柱 (在左側)
    ctx.fillStyle = '#1f2937'; // 深灰底座
    ctx.roundRect(roadStartX - 35, stopLineY - 30, 20, 50, 4);
    ctx.fill();
    
    // 燈號判定
    const isR = env.lightState === 'red';
    const isY = env.lightState === 'yellow';
    const isG = env.lightState === 'green';

    // 紅燈
    ctx.fillStyle = isR ? '#ef4444' : '#450a0a';
    if(isR) ctx.shadowColor = '#ef4444'; ctx.shadowBlur = isR ? 10 : 0;
    ctx.beginPath(); ctx.arc(roadStartX - 25, stopLineY - 20, 5, 0, Math.PI*2); ctx.fill();
    
    // 黃燈
    ctx.fillStyle = isY ? '#facc15' : '#422006';
    if(isY) ctx.shadowColor = '#facc15'; ctx.shadowBlur = isY ? 10 : 0;
    ctx.beginPath(); ctx.arc(roadStartX - 25, stopLineY - 5, 5, 0, Math.PI*2); ctx.fill();
    
    // 綠燈
    ctx.fillStyle = isG ? '#22c55e' : '#052e16';
    if(isG) ctx.shadowColor = '#22c55e'; ctx.shadowBlur = isG ? 10 : 0;
    ctx.beginPath(); ctx.arc(roadStartX - 25, stopLineY + 10, 5, 0, Math.PI*2); ctx.fill();
    
    ctx.shadowBlur = 0; // 重置陰影避免影響其他繪圖
}

function gameLoop() {
    ctx.fillStyle = '#111827'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    env.update();
    drawEnvironment();

    const roadWidth = canvas.width * CONFIG.ROAD_WIDTH_RATIO;
    const roadStartX = (canvas.width - roadWidth) / 2;

    // 更新與繪製行人
    pedestrians.forEach(ped => {
        ped.update(scooters, env.lightState, roadStartX + roadWidth);
        ped.draw(ctx);
    });

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