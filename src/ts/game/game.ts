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
import { KingBox } from "./entity/kingbox";
import { KB } from "./KB";

export class Game {

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    scale = 4;

    simulatedTimeMs: number | undefined;

    levelIndex = 0;
    showingTitle = true;
    curLevel: Level | undefined;

    keys: RegularKeys;
    nullKeys = new NullKeys();

    gameState = {
        hasCalledMoveRight: false,
        hasTalkedAboutFoundations: false,
    };

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

        this.doAnimationLoop();

        const savedLevel = Levels.getSavedLevelIndex();
        if (savedLevel != 0) {
            KB.speak('reload');
        }

        this.exportActionsToGlobal();

        this.startLevel(savedLevel);
    }

    nextLevel() {
        if (this.levelIndex == LEVELS.length - 1) {
            return;
        }
        this.startLevel(this.levelIndex + 1);
    }

    prevLevel() {
        if (this.levelIndex == 0) {
            return;
        }
        this.startLevel(this.levelIndex - 1);
    }

    startLevel(levelIndex: number, restart = false) {
        this.levelIndex = levelIndex;
        const levelInfo = LEVELS[this.levelIndex];
        const level = new Level(this, levelInfo);
        level.initFromImage();
        level.update(0);

        this.curLevel = level;

        if (levelInfo.song != undefined) {
            Sounds.setSong(levelInfo.song);
        }

        if (!restart) {
            level.logMessage();
        }

        const instructionsElem = document.querySelector(".instructions");
        if (levelInfo.name == 'lobby') {
            instructionsElem?.classList.remove("hidden");
        }
        else {
            instructionsElem?.classList.add("hidden");
        }

        Levels.saveLevel(levelInfo);
    }

    restart() {
        this.startLevel(this.levelIndex, true);
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

    exportActionsToGlobal() {
        window['restart'] = () => this.restart();
        window['nextLevel'] = () => this.nextLevel();
        window['skipToEnd'] = () => this.startLevel(LEVELS.length - 1);
        window['mute'] = () => Sounds.toggleMute();
        window['newGame'] = () => {
            Levels.clearSavedLevel();
            // Reload the page
            window.location.reload();
        }
    }

    static async preload() {
        await Promise.all([
            Levels.preload(),
            Tiles.preload(),
            Robot.preload(),
            Guard.preload(),
            KingBox.preload(),
            Background.preload(),
            Sounds.loadSound({name: 'bell', path: 'sfx'}),
            Sounds.loadSound({name: 'boss', path: 'music/'}),
            KB.preload(),
            Aseprite.loadImage({name: 'office-bg', basePath: 'sprites/'}),
        ]);
    }
}