// assets/js/config.js
export const CONFIG = {
    // 畫面設定
    CANVAS_WIDTH: 0, // 會在 main.js 中動態覆寫
    CANVAS_HEIGHT: 0,
    
    // 道路設定 (假設機車由上往下行駛)
    ROAD_WIDTH_RATIO: 0.6, // 道路佔畫面的寬度比例
    STOP_LINE_Y: 0.8,      // 停止線在畫面的 Y 軸比例 (80% 處)

    // 機車物理預設值
    MAX_SPEED: 4,
    MAX_FORCE: 0.1,
    SCOOTER_RADIUS: 4,     // 碰撞半徑
    
    // Boids 演算法權重基礎值
    SEPARATION_DIST: 20,   // 避障排斥距離（需大於車身對角線約14px）
    ALIGNMENT_DIST: 40,    // 對齊前車距離
    
    // 預設控制面板參數
    SPAWN_RATE: 10,
    AGGRESSIVE_RATIO: 0.3,
    CLUELESS_RATIO: 0.05,

    // 行人設定
    PEDESTRIAN_SPAWN_RATE: 3,
    ANNOYING_RATIO: 0.15
};