import { Point } from "../common";
import { lerp } from "../lib/util";

export class Camera {
    constructor() {
    }

    update(dt: number) {}

    applyTransform(context: CanvasRenderingContext2D) {}
}

export class FocusCamera extends Camera {

    target: (() => { x: number, y: number }) | undefined;

    curPos: Point | undefined;

    constructor() {
        super();
    }

    update(dt: number) {
        if (!this.target) {
            return;
        }
        const targetPos = this.target();
        if (!this.curPos) {
            this.curPos = targetPos;
            return;
        }

        const updateSmoothness = 1 - Math.exp(-3 * dt);
        this.curPos.x = lerp(this.curPos.x, targetPos.x, updateSmoothness);
        this.curPos.y = lerp(this.curPos.y, targetPos.y, updateSmoothness);
    }

    applyTransform(context: CanvasRenderingContext2D, scale=1) {
        if (this.curPos) {
            context.translate(Math.round(-scale * this.curPos.x), Math.round(-scale * this.curPos.y));
        }
    }
}

const screenPos: Point = { x: 0.5, y: 0.6 };

export function centerCanvas(context: CanvasRenderingContext2D) {
    context.translate(
        Math.round(context.canvas.width * screenPos.x),
        Math.round(context.canvas.height * screenPos.y));
}