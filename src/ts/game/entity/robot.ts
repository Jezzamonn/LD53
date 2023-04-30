import { FacingDir, Point } from "../../common";
import { FPS, PHYSICS_SCALE, TILE_SIZE, physFromPx } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { Level } from "../level";
import { SFX } from "../sfx";
import { ObjectTile } from "../tile/object-layer";
import { Entity } from "./entity"

export enum RobotAction {
    MoveLeft,
    MoveRight,
    Jump,
}

interface RobotActionData {
    action: RobotAction;
    data?: any;
    resolve: () => void;
}

const imageName = 'box';

export class Robot extends Entity {
    queuedActions: RobotActionData[] = [];

    currentAction: RobotActionData | undefined;

    moveSpeed = 1.5 * PHYSICS_SCALE * FPS;
    jumpSpeed = 3.5 * PHYSICS_SCALE * FPS;
    gravity = 0.3 * PHYSICS_SCALE * FPS * FPS;

    desiredMidX = 0;

    constructor(level: Level) {
        super(level);
        // TODO: Set w and h based on graphics
        this.w = physFromPx(8);
        this.h = physFromPx(5);
    }

    update(dt) {
        const prevAnimCount = this.animCount;

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
                }
            } else {
                this.checkForWin();
            }
        }

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
            default:
                this.dx = 0;
        }

        super.update(dt);

        // Play a sound depending on the frame of the animation.
        const animationName = this.getAnimationName();
        if (animationName == 'run') {
            const prevFrame = Aseprite.getFrame(imageName, animationName, prevAnimCount);
            const curFrame = Aseprite.getFrame(imageName, animationName, this.animCount);

            if (prevFrame != curFrame && curFrame == 5) {
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
        this.currentAction?.resolve();
        this.currentAction = undefined;
        this.dx = 0;
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
    }

    /**
     * Start moving the robot right
     *
     * @param amount Number of tiles to move right
     */
    startMoveRight(amount: number) {
        this.desiredMidX = this.midX + TILE_SIZE * amount;
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

    startJump() {
        this.dy = -this.jumpSpeed;
    }

    render(context: CanvasRenderingContext2D) {
        let animationName = this.getAnimationName();

        Aseprite.drawAnimation({
            context,
            image: imageName,
            animationName,
            time: this.animCount,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
            // filter: filter,
            flippedX: this.facingDir == FacingDir.Left,
        });
    }

    cameraFocus(): Point {
        return { x: this.midX, y: this.minY };
    }

    exportActionsToGlobal() {
        (window as any).moveLeft = (tiles: number) => {
            // Hello! If you're seeing this message, you typed "moveLeft" without adding the parentheses at the end. To call the function, type "moveLeft()".
            this.queueAction(RobotAction.MoveLeft, tiles);
        };
        (window as any).moveRight = (tiles: number) => {
            // Hello! If you're seeing this message, you typed "moveRight" without adding the parentheses at the end. To call the function, type "moveRight()".
            this.queueAction(RobotAction.MoveRight, tiles);
        }
        (window as any).jump = () => {
            // Hello! If you're seeing this message, you typed "jump" without adding the parentheses at the end. To call the function, type "jump()".
            this.queueAction(RobotAction.Jump);
        }
    }

    static async preload() {
        await Aseprite.loadImage({ name: imageName, basePath: "sprites" });
    }
}