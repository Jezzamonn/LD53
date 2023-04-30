import { Point } from "../common";
import { FPS, PHYSICS_SCALE, rng, TILE_SIZE, TILE_SIZE_PX } from "../constants";
import { Entity } from "./entity/entity";
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
import { Guard } from "./entity/guard";
import { Sounds } from "../lib/sounds";
import { KingBox } from "./entity/kingbox";
import { SFX } from "./sfx";
import { KB } from "./KB";

// Contains everything in one level, including the tiles and the entities.
export class Level {
    game: Game;
    entities: Entity[] = [];
    image: HTMLImageElement | undefined;
    levelInfo: LevelInfo

    camera: FocusCamera = new FocusCamera();
    background: Background;

    tiles: Tiles = new Tiles(0, 0);

    spawn: Point = { x: -1, y: -1 };

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

                this.tiles.baseLayer.setTile({ x, y }, BaseTile.Background);

                switch (color) {
                    case 'ffffff':
                        this.tiles.baseLayer.setTile({x, y}, BaseTile.Outside);
                        break;
                    case '000000':
                        this.tiles.baseLayer.setTile({ x, y }, BaseTile.Ground);
                        break;
                    case '3a4466':
                        this.tiles.baseLayer.setTile({ x, y }, BaseTile.Wall);
                        break;
                    case '5a6988':
                        // Don't need to do anything for background tiles as THEY'RE the default.
                        // this.tiles.baseLayer.setTile({ x, y }, BaseTile.Background);
                        break;
                    case '262b44':
                        this.tiles.baseLayer.setTile({ x, y }, BaseTile.Darkness);
                        break;
                    case '0000ff':
                        this.tiles.baseLayer.setTile({ x, y }, BaseTile.Stairs);
                        break;
                    case 'ffff00':
                        this.tiles.objectLayer.setTile({ x, y }, ObjectTile.Goal);
                        break;
                    case 'ff0000':
                        this.spawn = basePos;
                        this.tiles.objectLayer.setTile({ x, y }, ObjectTile.Spawn);
                        break;
                    case 'aa0000':
                        // Add a guard.
                        const guard = new Guard(this);
                        guard.midX = basePos.x;
                        guard.maxY = basePos.y;
                        this.entities.push(guard);
                        break;
                    case 'ff9900':
                        // Locked box with kingbox inside.
                        this.tiles.objectLayer.setTile({ x, y }, ObjectTile.LockedBox);
                        break;
                    default:
                        console.log(`Unknown color: ${color} at ${x}, ${y}.`);
                        break;
                }
            }
        }

        if (this.spawn.x == -1 || this.spawn.y == -1) {
            // If there was no marked spawn point, spawn the player at the lowest and most left stair tile.
            outer: for (let y = this.tiles.baseLayer.maxY; y >= 0; y--) {
                for (let x = 0; x < this.tiles.baseLayer.w; x++) {
                    if (this.tiles.baseLayer.getTile({ x, y }) == BaseTile.Stairs) {
                        this.spawn = this.tiles.getTileCoord({ x, y }, { x: 0.5, y: 1 });
                        break outer;
                    }
                }
            }
        }

        this.tiles.baseLayer.fillInUnknownTiles();

        this.tiles.baseLayer.allowGrow = true;
        this.tiles.objectLayer.allowGrow = true;

        this.camera.target = () => this.tiles.baseLayer.centerInPhysCoords;

        this.spawnPlayer();
    }

    logMessage() {
        KB.speak(this.levelInfo.name);
    }

    spawnPlayer() {
        // const robot = new Robot(this);
        const robot = new Robot(this);
        robot.midX = this.spawn.x;
        robot.maxY = this.spawn.y;
        this.entities.push(robot);

        // If the level is large, focus on the robot instead of the center.
        if (this.tiles.baseLayer.w > 15) {
            this.camera.target = () => robot.cameraFocus();
        }

        robot.exportActionsToGlobal();
    }

    spawnKingBox(coord: Point) {
        this.tiles.objectLayer.setTileAtCoord(coord, ObjectTile.Empty);

        const tileBasePos = this.tiles.getTileCoordFromCoord(coord, {x: 0.5, y: 1});

        // Spawn king box!
        const kingBox = new KingBox(this);
        kingBox.midX = tileBasePos.x;
        kingBox.maxY = tileBasePos.y;
        kingBox.spawnJump();
        this.entities.push(kingBox);

        this.camera.target = () => kingBox.cameraFocus();

        kingBox.exportActionsToGlobal();

        // Play music!
        Sounds.setSong('boss');
        // Play sound effect!
        SFX.play('explode');
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

        this.levelSpecificUpdate(dt);

        this.background.update(dt);
        this.tiles.update(dt);
        this.camera.update(dt);
    }

    levelSpecificUpdate(dt: number) {
        switch (this.levelInfo.name) {
            case 'kingbox':
                if (!this.won && this.noMoreTilesOnGround()) {
                    this.won = true;
                    this.destroyBuilding();
                }
                break;
        }
    }

    noMoreTilesOnGround(): boolean {
        for (var x = 0; x < this.tiles.baseLayer.maxX; x++) {
            const tile = this.tiles.baseLayer.getTile({
                x,
                y: this.tiles.baseLayer.maxY - 1,
            });
            if (tile == BaseTile.Wall) {
                return false;
            }
        }
        return true;
    }

    destroyBuilding() {
        KB.speak('win');
    }

    render(context: CanvasRenderingContext2D) {
        this.camera.applyTransform(context);

        this.background.render(context);

        this.tiles.render(context);

        for (const entity of this.entities) {
            entity.render(context);
        }
    }

    getEntitiesOfType<T extends Entity>(clazz: new (...args: any[]) => T): T[] {
        return this.entities.filter((ent) => ent instanceof clazz) as T[];
    }

    win() {
        this.won = true;
        this.game.win();
    }

    lose() {
        this.game.lose();
    }

}

function pixelToColorString(imageData: ImageData, x: number, y: number) {
    const i = (y * imageData.width + x) * 4;
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    return r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
}