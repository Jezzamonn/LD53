import { GAME_HEIGHT_PX, GAME_WIDTH_PX, physFromPx, PHYSICS_SCALE, pxFromPhys, RESTART_KEYS, SELECT_KEYS, TIME_STEP, TITLE_KEYS } from "../constants";
import { Sprite } from "./entity/sprite";
import { Aseprite } from "../lib/aseprite";
import { ComboKeys, KeyboardKeys, NullKeys, RegularKeys } from "../lib/keys";
import { Sounds } from "../lib/sounds";
import { centerCanvas } from "./camera";
import { Level } from "./level";
import { Levels, LEVELS } from "./levels";
import { SFX } from "./sfx";
import { Tiles } from "./tile/tiles";
import { Background } from "./background";
import { Robot } from "./entity/robot";
import { Guard } from "./entity/guard";

export class Game {

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    scale = 1;

    simulatedTimeMs: number | undefined;

    levelIndex = 0;
    showingTitle = true;
    curLevel: Level | undefined;

    keys: RegularKeys;
    nullKeys = new NullKeys();

    constructor(canvasSelector: string) {
        const canvas = document.querySelector<HTMLCanvasElement>(canvasSelector);
        if (!canvas) {
            throw new Error(`Could not find canvas with selector ${canvasSelector}`);
        }
        const context = canvas.getContext('2d')!;

        this.canvas = canvas;
        this.context = context;

        this.keys = new KeyboardKeys();

        Sounds.loadMuteState();
    }

    start() {
        this.keys.setUp();

        Aseprite.disableSmoothing(this.context);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Whenever any touch event happens, try to enter fullscreen.
        window.addEventListener('touchstart', () => this.enterFullscreen());

        this.doAnimationLoop();

        this.startLevel(0);
    }

    nextLevel() {
        this.startLevel((this.levelIndex + 1) % LEVELS.length);
    }

    prevLevel() {
        this.startLevel((this.levelIndex + LEVELS.length - 1) % LEVELS.length);
    }

    startLevel(levelIndex: number) {
        this.levelIndex = levelIndex;
        const levelInfo = LEVELS[this.levelIndex];
        const level = new Level(this, levelInfo);
        level.initFromImage();
        this.curLevel = level;

        // if (levelInfo.song) {
        //     Sounds.setSong(levelInfo.song);
        // }
    }

    win() {
        Sounds.playSound('bell');
        this.nextLevel();
    }

    lose() {
        SFX.play('alert');
        this.restart();
    }

    doAnimationLoop() {
        if (this.simulatedTimeMs == undefined) {
            this.simulatedTimeMs = Date.now();
        }

        let curTime = Date.now();
        let updateCount = 0;
        while (this.simulatedTimeMs < curTime) {
            this.update(TIME_STEP);

            this.simulatedTimeMs += 1000 * TIME_STEP;

            updateCount++;
            if (updateCount > 10) {
                this.simulatedTimeMs = curTime;
                break;
            }
        }

        this.render();

        requestAnimationFrame(() => this.doAnimationLoop());
    }

    handleInput() {
        if (this.keys.wasPressedThisFrame('KeyM')) {
            // Mute
            Sounds.toggleMute();
        }
        // Debug:
        if (this.keys.wasPressedThisFrame('Comma')) {
            this.prevLevel();
        }
        if (this.keys.wasPressedThisFrame('Period')) {
            this.nextLevel();
        }
        if (this.keys.anyWasPressedThisFrame(RESTART_KEYS)) {
            this.restart();
        }
    }

    restart() {
        this.startLevel(this.levelIndex);
    }

    update(dt: number) {
        try {
            this.handleInput();

            this.curLevel?.update(dt);

            this.keys.resetFrame();
        }
        catch (e) {
            console.error(e);
        }
    }

    applyScale(context: CanvasRenderingContext2D) {
        context.scale(this.scale, this.scale);
    }

    render() {
        this.context.resetTransform();
        centerCanvas(this.context);
        this.applyScale(this.context);

        try {
            this.curLevel?.render(this.context);
        }
        catch (e) {
            console.error(e);
        }
    }

    resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const pixelScale = window.devicePixelRatio || 1;

        // Set canvas size
        const xScale = windowWidth / GAME_WIDTH_PX;
        const yScale = windowHeight / GAME_HEIGHT_PX;

        // Math.min = scale to fit
        const pxScale = Math.floor(Math.min(xScale, yScale) * pixelScale);
        this.scale = pxScale / PHYSICS_SCALE;

        document.body.style.setProperty('--scale', `${pxScale / pixelScale}`);

        this.canvas.width = windowWidth * pixelScale;
        this.canvas.height = windowHeight * pixelScale;
        this.canvas.style.width = `${windowWidth}px`;
        this.canvas.style.height = `${windowHeight}px`;
        // Need to call this again when the canvas size changes.
        Aseprite.disableSmoothing(this.context);

        // Set HTML element size
        document.body.style.setProperty('--pageWidth', `${windowWidth}px`);
        document.body.style.setProperty('--pageHeight', `${windowHeight}px`);
    }

    enterFullscreen() {
        // If we're already fullscreen, don't do anything.
        if (document.fullscreenElement) {
            return;
        }

        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
    }

    static async preload() {
        await Promise.all([
            Levels.preload(),
            Tiles.preload(),
            Robot.preload(),
            Guard.preload(),
            Background.preload(),
            Sounds.loadSound({name: 'bell', path: 'sfx'})
        ]);
        SFX.preload();
    }
}