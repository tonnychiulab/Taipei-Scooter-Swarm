// assets/js/Environment.js
export class Environment {
    constructor() {
        this.lightState = 'green'; // 'green', 'yellow', 'red'
        this.mode = 'auto';
        this.laneLineMode = 'auto'; // 'auto' | 'forced-solid' | 'forced-dashed'

        this.frames = 0;
        this.redDuration = 350;
        this.greenDuration = 400;
        this.yellowDuration = 80;
    }

    get laneLineSolid() {
        if (this.laneLineMode === 'forced-solid') return true;
        if (this.laneLineMode === 'forced-dashed') return false;
        return this.lightState !== 'green';
    }

    // 小綠人狀態：依紅燈已過比例決定
    get walkingManState() {
        if (this.lightState !== 'red') return 'stop';
        if (this.mode !== 'auto') return 'slow'; // 強制模式無倒數
        const ratio = this.frames / this.redDuration;
        if (ratio < 0.4) return 'slow';
        if (ratio < 0.7) return 'fast';
        if (ratio < 0.9) return 'run';
        return 'fall';
    }

    // 行人通行剩餘秒數
    get pedSecondsLeft() {
        if (this.lightState !== 'red' || this.mode !== 'auto') return 0;
        return Math.max(0, Math.ceil((this.redDuration - this.frames) / 60));
    }

    update() {
        if (this.mode === 'auto') {
            this.frames++;
            if (this.lightState === 'green' && this.frames > this.greenDuration) {
                this.lightState = 'yellow';
                this.frames = 0;
            } else if (this.lightState === 'yellow' && this.frames > this.yellowDuration) {
                this.lightState = 'red';
                this.frames = 0;
            } else if (this.lightState === 'red' && this.frames > this.redDuration) {
                this.lightState = 'green';
                this.frames = 0;
            }
            this.updateUI();
        }
    }

    setMode(newMode) {
        this.mode = newMode;
        if (newMode === 'force-red') this.lightState = 'red';
        if (newMode === 'force-green') this.lightState = 'green';
        this.updateUI();
    }

    setLaneLineMode(mode) {
        this.laneLineMode = mode;
        this.updateUI();
    }

    updateUI() {
        const statusIndicator = document.getElementById('light-status');
        if (this.lightState === 'green') {
            statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]';
        } else if (this.lightState === 'yellow') {
            statusIndicator.className = 'w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]';
        } else {
            statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]';
        }

        const laneStatus = document.getElementById('lane-status');
        if (laneStatus) {
            laneStatus.textContent = this.laneLineSolid ? '實線' : '虛線';
            laneStatus.className = this.laneLineSolid
                ? 'text-xs text-yellow-400'
                : 'text-xs text-blue-400';
        }
    }
}
