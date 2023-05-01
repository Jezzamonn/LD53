import { FacingDir, Point } from "../../common";
import { FPS, PHYSICS_SCALE, TILE_SIZE, physFromPx } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { Sounds } from "../../lib/sounds";
import { clamp, clampInvLerp, experp, invLerp, lerp } from "../../lib/util";
import { KB } from "../KB";
import { Level } from "../level";
import { SFX } from "../sfx";
import { BaseTile } from "../tile/base-layer";
import { ObjectTile } from "../tile/object-layer";
import { Entity } from "./entity"

export enum RobotAction {
    MoveLeft,
    MoveRight,
    Jump,
    Destroy, // KingBox only actually.
    Open,
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

    imageName = "box";
    emoji = "📦";
    speed = 1;
    chainedActions = 0;

    followTarget: Entity | undefined;
    followCoords: Point[] = [];

    destroyedTileCount = 0;

    constructor(level: Level) {
        super(level);
        // TODO: Set w and h based on graphics
        this.w = physFromPx(8);
        this.h = physFromPx(5);
    }

    update(dt) {
        dt *= this.speed;

        const animationName = this.getAnimationName();

        const prevAnimCount = this.animCount;
        // Relative to the start of the animation.
        const prevFrame =
            Aseprite.getFrame(this.imageName, animationName, prevAnimCount) -
            Aseprite.getFrame(this.imageName, animationName, 0);

        if (this.currentAction == undefined) {
            if (this.queuedActions.length > 0) {
                this.currentAction = this.queuedActions.shift()!;
                switch (this.currentAction.action) {
                    case RobotAction.MoveLeft:
                        console.log(`${this.emoji}: Moving Left!`);
                        this.startMoveLeft(this.currentAction.data ?? 1);
                        break;
                    case RobotAction.MoveRight:
                        console.log(`${this.emoji}: Moving Right!`);
                        this.startMoveRight(this.currentAction.data ?? 1);
                        break;
                    case RobotAction.Jump:
                        console.log(`${this.emoji}: Jumping!`);
                        this.startJump();
                        break;
                    case RobotAction.Destroy:
                        console.log(`${this.emoji}: DESTROY!`);
                        this.startEat();
                        break;
                    case RobotAction.Open:
                        console.log(`${this.emoji}: Opening...`);
                        this.tryOpen();
                        break;
                }
            } else {
                this.checkForWin();
                this.chainedActions = 0;
                this.speed = 1;
            }
        }

        // Do this part now so the eat animation can react to it.
        this.animCount += dt;
        const curFrame =
            Aseprite.getFrame(this.imageName, animationName, this.animCount) -
            Aseprite.getFrame(this.imageName, animationName, 0);

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
            case RobotAction.Destroy:
                this.dx = 0;
                // TODO: Check the progress of the eating animation and:
                // - destroy stuff at the right time.
                // - finish the action when it's done.
                if (prevFrame != curFrame) {
                    if (curFrame == 3) {
                        // TODO: Play chomp / explosion sound, and do the actual destruction.
                        this.doEatingDestruction();
                    } else if (curFrame == 5) {
                        // End.
                        this.finishAction();
                    }
                }
                break;
            default:
                this.dx = 0;
        }

        if (this.dx > 0.01) {
            this.facingDir = FacingDir.Right;
        } else if (this.dx < -0.01) {
            this.facingDir = FacingDir.Left;
        }

        // Following
        if (this.followTarget) {
            const xDiff = this.midX - this.followTarget.midX;
            if (xDiff < -TILE_SIZE) {
                this.dx = this.moveSpeed;
            }
            else if (xDiff > TILE_SIZE) {
                this.dx = -this.moveSpeed;
            }
        }

        // Rest of the update stuff from super.update()
        this.applyGravity(dt);
        this.dampX(dt);

        this.move(dt);

        // Play a sound depending on the frame of the animation.
        if (animationName == "run") {
            if (prevFrame != curFrame && curFrame == 1) {
                SFX.play("step");
            }
        }
    }

    getAnimationName(): string {
        if (Math.abs(this.dx) > 0.01) {
            return "run";
        }
        return "idle";
    }

    finishAction() {
        // Quick hack to make this dialog appear here.
        if (
            this.currentAction?.action == RobotAction.MoveRight &&
            this.level.levelInfo.name == "lobby" &&
            !this.level.game.gameState.hasCalledMoveRight
        ) {
            this.level.game.gameState.hasCalledMoveRight = true;
            KB.speak('after-first-move');
        }

        this.currentAction?.resolve();
        this.currentAction = undefined;
        this.dx = 0;

        this.chainedActions++;
        this.speed = lerp(1, 4, clampInvLerp(this.chainedActions, 10, 50));
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
            this.isStanding() &&
            (this.currentAction?.action == RobotAction.MoveLeft ||
                this.currentAction?.action == RobotAction.MoveRight)
        ) {
            this.finishAction();
        }
    }

    onRightCollision(): void {
        super.onRightCollision();
        if (
            this.isStanding() &&
            (this.currentAction?.action == RobotAction.MoveLeft ||
                this.currentAction?.action == RobotAction.MoveRight)
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

    tryOpen() {
        // Check that a locked box is in front. Otherwise, fail!
        const coord = { x: this.midX, y: this.midY };
        const objectTile = this.level.tiles.objectLayer.getTileAtCoord(coord);
        if (objectTile != ObjectTile.LockedBox) {
            console.error(
                `${this.emoji}: Nothing to open! Try moving directly in front of the chest.`
            );
            this.finishAction();
            return;
        }

        // Clear the queue of actions.
        this.stop();

        // Now we need to spawn the box. Should probably be some animation, that can come later I guess.
        // Maybe should move this robot out of the way?
        // TODO: Animate this.
        this.x -= 0.5 * TILE_SIZE;

        this.level.spawnKingBox(coord);

        // Maybe there should be a delay before finishing?
        this.finishAction();
    }

    /**
     * Start moving the robot left
     *
     * @param amount Number of tiles to move left
     */
    startMoveLeft(amount: number) {
        this.desiredMidX = this.midX - TILE_SIZE * amount;
    }

    startEat() {
        this.animCount = 0;
    }

    doEatingDestruction() {
        const destructCoord = {
            x: Math.floor(this.midX / TILE_SIZE) + this.facingDirMult,
            y: Math.floor(this.midY / TILE_SIZE),
        };
        const destroyed = this.level.destroyAtCoord(destructCoord);

        // if (destroyed) {
        //     this.destroyedTileCount++;
        //     if (this.destroyedTileCount % 6 == 0) {
        //         this.level.addBabyRobot();
        //     }
        // }

        // TODO: Maybe only play explosion when actually destroying something?
        SFX.play("explode");
    }

    // Empties the queue.
    stop() {
        while (this.queuedActions.length > 0) {
            this.queuedActions.shift()?.resolve();
        }
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
        SFX.play("jump");
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
        };
        (window as any).jump = (argument: any) => {
            // Hello! If you're seeing this message, you typed "jump" without adding the parentheses at the end. To call the function, type "jump()".
            if (argument !== undefined) {
                console.warn(
                    `${this.emoji}: Warning: jump() does not take any arguments. I will just jump once.`
                );
            }
            return this.queueAction(RobotAction.Jump);
        };
        // This overrides the default window.open function. Whatever.
        (window as any).open = (argument: any) => {
            // Hello! If you're seeing this message, you typed "open" without adding the parentheses at the end. To call the function, type "open()".
            if (argument !== undefined) {
                console.warn(
                    `${this.emoji}: Warning: open() does not take any arguments.`
                );
            }
            return this.queueAction(RobotAction.Open);
        };
        (window as any).stop = (argument: any) => {
            // Hello! If you're seeing this message, you typed "stop" without adding the parentheses at the end. To call the function, type "stop()".
            if (argument !== undefined) {
                console.warn(
                    `${this.emoji}: Warning: stop() does not take any arguments.`
                );
            }
            this.stop();
            return Promise.resolve();
        };
    }

    static async preload() {
        await Aseprite.loadImage({ name: "box", basePath: "sprites" });
    }
}