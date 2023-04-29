import { FacingDir, Point } from "../../common";
import { FPS, PHYSICS_SCALE, TILE_SIZE, physFromPx } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { Level } from "../level";
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
}

const imageName = 'box';

export class Robot extends Entity {
    queuedActions: RobotActionData[] = [];

    currentAction: RobotAction | undefined;

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
        if (this.currentAction == undefined) {
            if (this.queuedActions.length > 0) {
                const { action, data } = this.queuedActions.shift()!;
                this.currentAction = action;
                switch (this.currentAction) {
                    case RobotAction.MoveLeft:
                        this.startMoveLeft(data ?? 1);
                        break;
                    case RobotAction.MoveRight:
                        this.startMoveRight(data ?? 1);
                        break;
                    case RobotAction.Jump:
                        this.startJump();
                        break;
                }
            } else {
                this.checkForWin();
            }
        }

        switch (this.currentAction) {
            case RobotAction.MoveLeft:
                this.dx = -this.moveSpeed;
                if (this.midX <= this.desiredMidX) {
                    this.midX = this.desiredMidX;
                    this.currentAction = undefined;
                }
                break;
            case RobotAction.MoveRight:
                this.dx = this.moveSpeed;
                if (this.midX >= this.desiredMidX) {
                    this.midX = this.desiredMidX;
                    this.currentAction = undefined;
                }
                break;
            default:
                this.dx = 0;
        }

        super.update(dt);
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
            this.currentAction == RobotAction.MoveLeft ||
            this.currentAction == RobotAction.MoveRight
        ) {
            this.currentAction = undefined;
        }
    }

    onRightCollision(): void {
        super.onRightCollision();
        if (
            this.currentAction == RobotAction.MoveLeft ||
            this.currentAction == RobotAction.MoveRight
        ) {
            this.currentAction = undefined;
        }
    }

    onDownCollision() {
        super.onDownCollision();
        if (this.currentAction == RobotAction.Jump) {
            this.currentAction = undefined;
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

    startJump() {
        this.dy = -this.jumpSpeed;
    }

    render(context: CanvasRenderingContext2D) {
        let animationName = "idle";

        if (Math.abs(this.dx) > 0.01) {
            animationName = "run";
        }

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
            this.queuedActions.push({
                action: RobotAction.MoveLeft,
                data: tiles,
            });
        };
        (window as any).moveRight = (tiles: number) => {
            this.queuedActions.push({
                action: RobotAction.MoveRight,
                data: tiles,
            });
        };
        (window as any).jump = () => {
            this.queuedActions.push({
                action: RobotAction.Jump,
            });
        };
    }

    static async preload() {
        await Aseprite.loadImage({ name: imageName, basePath: "sprites" });
    }
}