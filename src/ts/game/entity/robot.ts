import { Point } from "../../common";
import { FPS, PHYSICS_SCALE, TILE_SIZE, physFromPx } from "../../constants";
import { Level } from "../level";
import { ObjectTile } from "../tile/object-layer";
import { Entity } from "./entity"

export enum RobotAction {
    MoveLeft,
    MoveRight,
}

interface RobotActionData {
    action: RobotAction;
    data: any;
}

export class Robot extends Entity {

    queuedActions: RobotActionData[] = [];

    currentAction: RobotAction | undefined;

    moveSpeed = 1.5 * PHYSICS_SCALE * FPS;

    desiredMidX = 0;

    constructor(level: Level) {
        super(level);
        // TODO: Set w and h based on graphics
        this.w = physFromPx(6);
        this.h = physFromPx(10);
    }

    update(dt) {
        if (this.currentAction == undefined) {
            if (this.queuedActions.length > 0) {
                const { action, data } = this.queuedActions.shift()!
                this.currentAction = action;
                switch (this.currentAction) {
                    case RobotAction.MoveLeft:
                        this.startMoveLeft(data ?? 1);
                        break;
                    case RobotAction.MoveRight:
                        this.startMoveRight(data ?? 1);
                        break;
                }
            }
            else {
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
        if (this.isTouchingTile(this.level.tiles.objectLayer, ObjectTile.Goal)) {
            this.level.win();
        }
    }

    onLeftCollision(): void {
        if (this.currentAction == RobotAction.MoveLeft || this.currentAction == RobotAction.MoveRight) {
            this.currentAction = undefined;
        }
        super.onLeftCollision();
    }

    onRightCollision(): void {
        if (this.currentAction == RobotAction.MoveLeft || this.currentAction == RobotAction.MoveRight) {
            this.currentAction = undefined;
        }
        super.onRightCollision();
    }

    /**
     * Start moving the robot left
     *
     * @param amount Number of tiles to move left
     */
    startMoveLeft(amount: number) {
        this.desiredMidX = this.midX - TILE_SIZE * amount;
        this.currentAction = RobotAction.MoveLeft;
    }

    /**
     * Start moving the robot right
     *
     * @param amount Number of tiles to move right
     */
    startMoveRight(amount: number) {
        this.desiredMidX = this.midX + TILE_SIZE * amount;
        this.currentAction = RobotAction.MoveRight;
    }

    render(context: CanvasRenderingContext2D) {
        super.render(context);
    }

    cameraFocus(): Point {
        return { x: this.midX, y: this.minY };
    }

    exportActionsToGlobal() {
        (window as any).moveLeft = (tiles: number) => this.queuedActions.push({
            action: RobotAction.MoveLeft,
            data: tiles,
        });
        (window as any).moveRight = (tiles: number) => this.queuedActions.push({
            action: RobotAction.MoveRight,
            data: tiles,
        });
    }

}