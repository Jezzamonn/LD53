import { Point } from "../../common";
import { physFromPx, PHYSICS_SCALE } from "../../constants";
import { Level } from "../level";
import { Aseprite } from "../../lib/aseprite";
import { Entity } from "./entity";

export class Sprite extends Entity {
    imageName = "";
    animationName = "";
    oneLoop = false;
    anchorRatios: Point;
    flippedX = false;

    constructor(
        level: Level,
        {
            imageName,
            animationName,
            oneLoop = false,
            flippedX = false,
            anchorRatios = { x: 0.5, y: 1 },
        }: {
            imageName: string;
            animationName: string;
            oneLoop?: boolean;
            flippedX?: boolean;
            anchorRatios?: Point;
        }
    ) {
        super(level);

        this.imageName = imageName;
        this.animationName = animationName;
        this.oneLoop = oneLoop;
        this.anchorRatios = anchorRatios;
        this.flippedX = flippedX;

        Aseprite.images[imageName].loadPromise!.then((image) => {
            this.w = physFromPx(image.frames![0].sourceSize.w);
            this.h = physFromPx(image.frames![0].sourceSize.h);

            this.x = this.x - this.w * this.anchorRatios.x;
            this.y = this.y - this.h * this.anchorRatios.y;
        });
    }

    update(dt: number): void {
        super.update(dt);

        if (this.oneLoop) {
            const imageData = Aseprite.images[this.imageName];
            const animData = imageData.animations![this.animationName];
            if (this.animCount * 1000 >= animData.length) {
                this.done = true;
            }
        }
    }

    render(context: CanvasRenderingContext2D) {
        // context.fillRect(this.x, this.y, this.w, this.h);
        Aseprite.drawAnimation({
            context,
            image: this.imageName,
            animationName: this.animationName,
            time: this.animCount,
            position: {
                x: this.x + this.anchorRatios.x * this.w,
                y: this.y + this.anchorRatios.y * this.h,
            },
            scale: PHYSICS_SCALE,
            anchorRatios: this.anchorRatios,
            loop: !this.oneLoop,
            flippedX: this.flippedX,
        });
    }
}
