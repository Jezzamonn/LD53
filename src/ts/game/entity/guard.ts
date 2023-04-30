import { FacingDir } from "../../common";
import { FPS, PHYSICS_SCALE, TILE_SIZE, physFromPx, rng } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { lerp } from "../../lib/util";
import { Level } from "../level";
import { Entity } from "./entity";
import { Robot } from "./robot";

const imageName = 'guard';

enum GuardState {
    Idle,
    Walking,
}

const walkSpeed = 0.5 * PHYSICS_SCALE * FPS;
const runSpeed = 1.5 * PHYSICS_SCALE * FPS;

export class Guard extends Entity {

    timeLeftInState = 0;
    state = GuardState.Idle;
    foundRobot = false;

    constructor(level: Level) {
        super(level);

        // Actual w is 4px.
        // A bit extra so that they don't get too close to walls / edges.
        this.w = physFromPx(8);
        this.h = physFromPx(12);

        this.xDampAmt = 0.03 * PHYSICS_SCALE * FPS * FPS;

        this.startIdle();
    }

    update(dt) {
        this.animCount += dt;
        this.applyGravity(dt);
        this.move(dt);

        this.timeLeftInState -= dt;
        if (this.timeLeftInState <= 0) {
            if (this.state == GuardState.Walking) {
                this.startIdle();
            }
            else {
                this.startWalking();
            }
        }

        switch (this.state) {
            case GuardState.Idle:
                this.dampX(dt);
                break;
            case GuardState.Walking:
                this.dx = this.facingDir == FacingDir.Right ? walkSpeed : -walkSpeed;
                break;
        }

        this.checkForMovingRobot();
    }

    checkForMovingRobot() {
        const robot = this.level.getEntitiesOfType(Robot)[0];
        if (!robot) {
            // That's weird. Whatever??
            return;
        }

        // Can't see moving robots.
        if (robot.dx == 0) {
            return false;
        }

        if (this.robotIsInRange(robot)) {
            this.foundRobot = true;
            this.level.lose();
            return;
        }
    }

    robotIsInRange(robot: Robot): boolean {
        // Check if at same level
        const robotRow = Math.floor(robot.midY / TILE_SIZE);
        const guardRow = Math.floor(this.midY / TILE_SIZE);
        if (robotRow != guardRow) {
            return false;
        }

        // Check if line of sight
        const robotDirection = robot.midX > this.midX ? FacingDir.Right : FacingDir.Left;
        if (robotDirection != this.facingDir) {
            return false;
        }

        const dist = Math.abs(robot.midX - this.midX);
        if (dist > 3 * TILE_SIZE) {
            return false;
        }

        return true;
    }

    startIdle() {
        this.state = GuardState.Idle;
        this.timeLeftInState = lerp(1, 3, rng());
    }

    startWalking() {
        this.state = GuardState.Walking;
        this.timeLeftInState = lerp(1, 3, rng());
    }

    onLeftCollision(): void {
        super.onLeftCollision();
        this.facingDir = FacingDir.Right;
        this.startIdle();
    }

    onRightCollision(): void {
        super.onRightCollision();
        this.facingDir = FacingDir.Left;
        this.startIdle();
    }


    render(context: CanvasRenderingContext2D) {
        let animationName = 'idle';

        if (Math.abs(this.dx) > 0.01) {
            animationName = 'walk';
        }

        Aseprite.drawAnimation({
            context,
            image: imageName,
            animationName,
            time: this.animCount,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
            flippedX: this.facingDir == FacingDir.Left,
        });
    }

    static async preload() {
        await Aseprite.loadImage({ name: imageName, basePath: 'sprites/' });
    }
}