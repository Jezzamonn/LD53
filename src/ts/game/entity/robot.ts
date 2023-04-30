import { FacingDir, Point } from "../../common";
import { FPS, PHYSICS_SCALE, TILE_SIZE, physFromPx } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { Level } from "../level";
import { SFX } from "../sfx";
import { BaseTile } from "../tile/base-layer";
import { ObjectTile } from "../tile/object-layer";
import { Entity } from "./entity"

export enum RobotAction {
    MoveLeft,
    MoveRight,
    Jump,
    Eat, // KingBox only actually.
}

interface RobotActionData {
    action: RobotAction;
    data?: any;
    resolve: () => void;
}

export class Robot extends Entity {
    queuedActions: RobotActionData[] = [];

    currentAction: RobotActionData | undefined;

    moveSpeed = 1.5 * PHYSICS_SCALE * FPS;
    jumpSpeed = 3.5 * PHYSICS_SCALE * FPS;
    gravity = 0.3 * PHYSICS_SCALE * FPS * FPS;

    desiredMidX = 0;

    imageName = 'box';
    emoji = '📦';

    constructor(level: Level) {
        super(level);
        // TODO: Set w and h based on graphics
        this.w = physFromPx(8);
        this.h = physFromPx(5);
    }

    update(dt) {
        const animationName = this.getAnimationName();

        const prevAnimCount = this.animCount;
        // Relative to the start of the animation.
        const prevFrame = Aseprite.getFrame(this.imageName, animationName, prevAnimCount) - Aseprite.getFrame(this.imageName, animationName, 0);

        if (this.currentAction == undefined) {
            if (this.queuedActions.length > 0) {
                this.currentAction = this.queuedActions.shift()!;
                switch (this.currentAction.action) {
                    case RobotAction.MoveLeft:
                        this.startMoveLeft(this.currentAction.data ?? 1);
                        break;
                    case RobotAction.MoveRight:
                        this.startMoveRight(this.currentAction.data ?? 1);
                        break;
                    case RobotAction.Jump:
                        this.startJump();
                        break;
                    case RobotAction.Eat:
                        this.startEat();
                        break;
                }
            } else {
                this.checkForWin();
            }
        }

        // Do this part now so the eat animation can react to it.
        this.animCount += dt;
        const curFrame = Aseprite.getFrame(this.imageName, animationName, this.animCount) - Aseprite.getFrame(this.imageName, animationName, 0);

        switch (this.currentAction?.action) {
            case RobotAction.MoveLeft:
                this.dx = -this.moveSpeed;
                if (this.midX <= this.desiredMidX) {
                    this.midX = this.desiredMidX;
                    this.finishAction();
                }
                break;
            case RobotAction.MoveRight:
                this.dx = this.moveSpeed;
                if (this.midX >= this.desiredMidX) {
                    this.midX = this.desiredMidX;
                    this.finishAction();
                }
                break;
            case RobotAction.Eat:
                this.dx = 0;
                // TODO: Check the progress of the eating animation and:
                // - destroy stuff at the right time.
                // - finish the action when it's done.
                if (prevFrame != curFrame) {
                    if (curFrame == 3) {
                        // TODO: Play chomp / explosion sound, and do the actual destruction.
                        this.doEatingDestruction();
                    }
                    else if (curFrame == 5) {
                        // End.
                        this.finishAction();
                    }
                }
                break;
            default:
                this.dx = 0;
        }

        // Rest of the update stuff from super.update()
        this.applyGravity(dt);
        this.dampX(dt);

        this.move(dt);

        // Play a sound depending on the frame of the animation.
        if (animationName == 'run') {
            if (prevFrame != curFrame && curFrame == 1) {
                SFX.play('step');
            }
        }
    }

    getAnimationName(): string {
        if (Math.abs(this.dx) > 0.01) {
            return "run";
        }
        return 'idle';
    }


    finishAction() {
        // Quick hack to make this dialog appear here.
        if (this.currentAction?.action == RobotAction.MoveRight &&
            this.level.levelInfo.name == "lobby" &&
            !this.level.game.gameState.hasCalledMoveRight) {
            this.level.game.gameState.hasCalledMoveRight = true;
            console.log('👑: Good job! Try calling it again to make it to the elevator.')
        }

        this.currentAction?.resolve();
        this.currentAction = undefined;
        this.dx = 0;

        // Quick hardcoded thing to play a message a function is first called on the first level.

    }

    checkForWin() {
        if (
            this.isTouchingTile(this.level.tiles.objectLayer, ObjectTile.Goal)
        ) {
            this.level.win();
        }
    }

    onLeftCollision(): void {
        super.onLeftCollision();
        if (
            this.currentAction?.action == RobotAction.MoveLeft ||
            this.currentAction?.action == RobotAction.MoveRight
        ) {
            this.finishAction();
        }
    }

    onRightCollision(): void {
        super.onRightCollision();
        if (
            this.currentAction?.action == RobotAction.MoveLeft ||
            this.currentAction?.action == RobotAction.MoveRight
        ) {
            this.finishAction();
        }
    }

    onDownCollision() {
        super.onDownCollision();
        if (this.currentAction?.action == RobotAction.Jump) {
            this.finishAction();
        }
    }

    /**
     * Start moving the robot left
     *
     * @param amount Number of tiles to move left
     */
    startMoveLeft(amount: number) {
        this.desiredMidX = this.midX - TILE_SIZE * amount;
        console.log(`${this.emoji}: Moving Left!`);
    }

    startEat() {
        console.log(`${this.emoji}: DESTROY!`);
        this.animCount = 0;
    }

    doEatingDestruction() {
        SFX.play('explode');
        // TODO: Figure out how this works with the sky and such.
        const destructCoord = {x: this.midX + this.facingDirMult * TILE_SIZE, y: this.midY};
        this.level.tiles.baseLayer.setTileAtCoord(destructCoord, BaseTile.Background);
        this.level.tiles.objectLayer.setTileAtCoord(destructCoord, ObjectTile.Empty);
    }

    /**
     * Start moving the robot right
     *
     * @param amount Number of tiles to move right
     */
    startMoveRight(amount: number) {
        this.desiredMidX = this.midX + TILE_SIZE * amount;
        console.log(`${this.emoji}: Moving Right!`);
    }

    startJump() {
        this.dy = -this.jumpSpeed;
        SFX.play('jump');

        console.log(`${this.emoji}: Jumping!`);
    }

    queueAction(action: RobotAction, data: any = undefined): Promise<void> {
        return new Promise<void>((resolve) => {
            this.queuedActions.push({
                action,
                data,
                resolve,
            });
        });
    }

    render(context: CanvasRenderingContext2D) {
        let animationName = this.getAnimationName();

        Aseprite.drawAnimation({
            context,
            image: this.imageName,
            animationName,
            time: this.animCount,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
            flippedX: this.facingDir == FacingDir.Left,
        });
    }

    cameraFocus(): Point {
        return { x: this.midX, y: this.minY };
    }

    exportActionsToGlobal() {
        (window as any).moveLeft = (tiles: number) => {
            // Hello! If you're seeing this message, you typed "moveLeft" without adding the parentheses at the end. To call the function, type "moveLeft()".
            return this.queueAction(RobotAction.MoveLeft, tiles);
        };
        (window as any).moveRight = (tiles: number) => {
            // Hello! If you're seeing this message, you typed "moveRight" without adding the parentheses at the end. To call the function, type "moveRight()".
            return this.queueAction(RobotAction.MoveRight, tiles);
        }
        (window as any).jump = (argument: any) => {
            // Hello! If you're seeing this message, you typed "jump" without adding the parentheses at the end. To call the function, type "jump()".
            if (argument !== undefined) {
                console.warn(`${this.emoji}: Warning: jump() does not take any arguments. I will just jump once.`);
            }
            return this.queueAction(RobotAction.Jump);
        }
    }

    static async preload() {
        await Aseprite.loadImage({ name: 'box', basePath: "sprites" });
    }
}