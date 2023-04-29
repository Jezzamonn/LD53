import { Point } from "../common";
import { rng, TILE_SIZE, TILE_SIZE_PX } from "../constants";
import { Entity } from "./entity/entity";
import { Player } from "./entity/player";
import { Sprite } from "./entity/sprite";
import { Images } from "../lib/images";
import { Camera, FocusCamera } from "./camera";
import { Game } from "./game";
import { LevelInfo } from "./levels";
import { Tiles } from "./tile/tiles";
import { Background } from "./background";
import { BaseTile } from "./tile/base-layer";
import { ObjectTile } from "./tile/object-layer";
import { Robot } from "./entity/robot";

// Contains everything in one level, including the tiles and the entities.
export class Level {
    game: Game;
    entities: Entity[] = [];
    image: HTMLImageElement | undefined;
    levelInfo: LevelInfo

    camera: FocusCamera = new FocusCamera();
    background: Background;

    tiles: Tiles = new Tiles(0, 0);

    start: Point = { x: 0, y: 0 };

    won = false;

    constructor(game: Game, levelInfo: LevelInfo) {
        this.game = game;
        this.levelInfo = levelInfo;
    }

    initFromImage() {
        const image = Images.images[this.levelInfo.name].image!;
        this.image = image;
        this.entities = [];
        this.tiles = new Tiles(image.width, image.height);

        this.background = new Background(this, {
            x: TILE_SIZE_PX * image.width / 2,
            y: TILE_SIZE_PX * image.height / 2,
        });

        // Draw the image to a canvas to get the pixels.
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0, image.width, image.height);

        // Read the pixels. White is empty, black is wall, and the red square is the starting position.
        const imageData = context.getImageData(0, 0, image.width, image.height);
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {

                const basePos = this.tiles.getTileCoord({x, y}, { x: 0.5, y: 1 })

                const color = pixelToColorString(imageData, x, y);
                if (color === 'ffffff') {
                    // Don't need to do anything for empty tiles as they're the default.
                }
                else if (color === '000000') {
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Wall, { allowGrow: false });
                }
                else if (color === 'aaaaaa') {
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Background, { allowGrow: false });
                }
                else if (color === 'ffff00') {
                    this.tiles.objectLayer.setTile({ x, y }, ObjectTile.Goal, { allowGrow: false });
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Unknown, { allowGrow: false });
                }
                else if (color === 'ff0000') {
                    this.start = basePos;
                    this.tiles.objectLayer.setTile({ x, y }, ObjectTile.Spawn, { allowGrow: false });
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Unknown, { allowGrow: false });
                }
                else if (color === '0000ff') {
                    this.tiles.objectLayer.setTile({ x, y }, ObjectTile.Platform, { allowGrow: false });
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Unknown, { allowGrow: false });
                }
                else {
                    console.log(`Unknown color: ${color} at ${x}, ${y}.`);
                }
            }
        }
        this.tiles.baseLayer.fillInUnknownTiles();

        // this.camera.target = () => ({x: this.start.x, y: this.start.y});

        this.spawnPlayer();
    }

    spawnPlayer() {
        const robot = new Robot(this);
        robot.midX = this.start.x;
        robot.maxY = this.start.y;
        this.entities.push(robot);

        this.camera.target = () => robot.cameraFocus();

        robot.exportActionsToGlobal();
    }

    update(dt: number) {
        for (const entity of this.entities) {
            entity.update(dt);
        }

        for (let i = this.entities.length - 1; i >= 0; i--) {
            if (this.entities[i].done) {
                this.entities.splice(i, 1);
            }
        }

        this.background.update(dt);
        this.tiles.update(dt);
        this.camera.update(dt);
    }

    render(context: CanvasRenderingContext2D) {
        this.camera.applyTransform(context);

        this.background.render(context);

        this.tiles.render(context);

        for (const entity of this.entities) {
            entity.render(context);
        }
    }

    win() {
        this.won = true;
        this.game.win();
    }
}

function pixelToColorString(imageData: ImageData, x: number, y: number) {
    const i = (y * imageData.width + x) * 4;
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    return r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
}