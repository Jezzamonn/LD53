import { Point } from "../../common";
import { physFromPx, PHYSICS_SCALE } from "../../constants";
import { Level } from "../level";
import { Aseprite } from "../../lib/aseprite";
import { Entity } from "./entity";

export class Sprite extends Entity {

    name = '';
    oneLoop = false;
    anchorRatios: Point;

    constructor(level: Level, name: string, { oneLoop = false, anchorRatios = { x: 0.5, y: 1 } } = {}) {
        super(level);

        this.name = name;
        this.oneLoop = oneLoop;
        this.anchorRatios = anchorRatios;

        Aseprite.images[name].loadPromise!.then(image => {
            this.w = physFromPx(image.frames![0].sourceSize.w)
            this.h = physFromPx(image.frames![0].sourceSize.h)

            this.x = this.x - this.w * this.anchorRatios.x;
            this.y = this.y - this.h * this.anchorRatios.y;
        });
    }

    update(dt: number): void {
        super.update(dt);

        if (this.oneLoop) {
            const imageData = Aseprite.images[this.name];
            const animData = imageData.animations!['idle'];
            if (this.animCount * 1000 >= animData.length) {
                this.done = true;
            }
        }
    }

    render(context: CanvasRenderingContext2D) {
        // context.fillRect(this.x, this.y, this.w, this.h);
        Aseprite.drawAnimation({
            context,
            image: this.name,
            animationName: 'idle',
            time: this.animCount,
            position: {
                x: this.x + this.anchorRatios.x * this.w,
                y: this.y + this.anchorRatios.y * this.h,
            },
            scale: PHYSICS_SCALE,
            anchorRatios: this.anchorRatios,
            loop: !this.oneLoop,
        });
    }
}