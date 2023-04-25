import { Point } from "../common";
import { physFromPx, PHYSICS_SCALE } from "../constants";
import { Aseprite } from "../lib/aseprite";
import { Images } from "../lib/images";
import { centerCanvas } from "./camera";
import { Level } from "./level";

interface ImageLayerInfo {
    image: string,
    scale: number,
    offset?: Point,
}

interface FillLayerInfo {
    color: string,
}

type LayerInfo = ImageLayerInfo | FillLayerInfo;

const BG_LAYERS: LayerInfo[] = [
    {
        image: "background",
        scale: 0.05,
        offset: {
            x: 0,
            y: -20,
        },
    },
    {
        color: "#c0cbdc",
    },
];
export class Background {
    level: Level;

    layers: BackgroundLayer[] = [];
    offset: Point;

    constructor(level: Level, offset: Point) {
        this.level = level;
        this.offset = offset;

        for (const layer of BG_LAYERS) {
            if ("image" in layer) {
                this.layers.push(
                    new ImageLayer({
                        background: this,
                        image: layer.image,
                        scale: layer.scale,
                        offset: layer.offset,
                    })
                );
            }
            else {
                this.layers.push(
                    new FillLayer({
                        color: layer.color,
                    })
                );
            }
        }
    }

    update(dt: number) {
        for (const layer of this.layers) {
            layer.update(dt);
        }
    }

    render(context: CanvasRenderingContext2D) {
        for (const layer of this.layers) {
            layer.render(context);
        }
    }

    static async preload() {
        const promises: Promise<any>[] = [];
        for (const layer of BG_LAYERS) {
            if ("image" in layer) {
                promises.push(
                    Images.loadImage({ name: layer.image, path: "sprites/" })
                );
            }
        }
        await Promise.all(promises);
    }
}

interface BackgroundLayer {
    update(dt: number): void;

    render(context: CanvasRenderingContext2D): void;
}

class FillLayer implements BackgroundLayer {
    color: string;

    constructor({ color }: { color: string }) {
        this.color = color;
    }

    update(dt: number) {}

    render(context: CanvasRenderingContext2D) {
        // Clear transform
        context.save();
        context.resetTransform();
        context.fillStyle = this.color;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.restore();
    }
}

class ImageLayer implements BackgroundLayer{
    background: Background;
    animCount = 0;
    image = "";
    scale = 1;

    offset: Point;

    constructor({
        background,
        image,
        scale,
        offset = {x: 0, y: 0},
    }: {
        background: Background;
        image: string;
        scale: number;
        offset?: Point;
    }) {
        this.background = background;
        this.image = image;
        this.scale = scale;
        this.offset = offset;
    }

    update(dt: number) {
        this.animCount += dt;
    }

    render(context: CanvasRenderingContext2D) {
        // TODO: Apply scale.
        context.save();
        context.resetTransform();

        centerCanvas(context);

        // This part of the code could be better so it's not reaching into the
        // other parts of the code base as much. Probably requires refactoring
        // of some camera stuff.
        this.background.level.game.applyScale(context);
        this.background.level.camera.applyTransform(context, this.scale);

        // const isCloud = this.image.startsWith("bg-clouds");
        // let windOffset = 0;
        // if (isCloud) {
        //     windOffset = 30 * this.scale * this.animCount;
        // }

        const image = Images.images[this.image].image!;
        context.drawImage(image,
            physFromPx(this.offset.x - image.width / 2 + this.scale * this.background.offset.x),
            physFromPx(this.offset.y - image.height / 2 + this.scale * this.background.offset.y),
            physFromPx(image.width),
            physFromPx(image.height),
        );

        context.restore();
    }
}
