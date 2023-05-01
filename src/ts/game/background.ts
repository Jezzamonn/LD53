import { Point } from "../common";
import { FPS, physFromPx, PHYSICS_SCALE, rng, TILE_SIZE, visualRng } from "../constants";
import { Aseprite } from "../lib/aseprite";
import { Images } from "../lib/images";
import { lerp } from "../lib/util";
import { centerCanvas } from "./camera";
import { Level } from "./level";

export class Background {
    level: Level;

    layers: BackgroundLayer[] = [];
    offset: Point;

    constructor(level: Level, offset: Point) {
        this.level = level;
        this.offset = offset;

        this.layers = [
            new FillLayer({
                color: '#c0cbdc',
            }),
            new CloudLayer(this),
        ];
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
        await Promise.all([
            Aseprite.loadImage({
                name: 'cloud', basePath: 'sprites/'
            }),
        ]);
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

interface CloudInfo {
    dx: number;
    x: number;
    y: number;
    frame: number;
}

class CloudLayer implements BackgroundLayer {
    background: Background;

    clouds: CloudInfo[] = [];
    animCount = 0;
    cloudSpawnCount = 0;

    constructor(background: Background) {
        this.background = background;

        // Lazy way to initialize this
        for (var i = 0; i < 20; i++) {
            this.update(20);
        }
    }

    update(dt: number): void {
        this.animCount += dt;

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            cloud.x += cloud.dx * dt;
            // This number is weird and hard-coded but whatver I guess.
            if (cloud.x > 30 * TILE_SIZE) {
                this.clouds.splice(i, 1);
                i--;
            }
        }

        // Add some clouds periodically.
        while (this.animCount > 4 * this.cloudSpawnCount) {
            this.cloudSpawnCount++;
            // These numbers are weird and hard-coded but whatver I guess.
            this.clouds.push({
                dx: physFromPx(lerp(0.02, 0.05, visualRng())) * FPS,
                x: -12 * TILE_SIZE,
                y: lerp(-30 * TILE_SIZE, 30 * TILE_SIZE, visualRng()),
                frame: Math.floor(visualRng() * 4),
            });
        }
    }

    render(context: CanvasRenderingContext2D): void {
        for (const cloud of this.clouds) {
            Aseprite.drawSprite({
                context,
                image: 'cloud',
                frame: cloud.frame,
                position: {
                    x: Math.round(cloud.x + this.background.offset.x),
                    y: Math.round(cloud.y + this.background.offset.y),
                },
                scale: PHYSICS_SCALE,
            });
        }
    }

}
