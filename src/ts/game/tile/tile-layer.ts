import { Point } from "../../common";
import { PHYSICS_SCALE, rng, TILE_SIZE, TILE_SIZE_PX } from "../../constants";
import { Aseprite, images } from "../../lib/aseprite";
import { Images } from "../../lib/images";
import { ObjectTile } from "./object-layer";
import { TileSource } from "./tiles";

/**
 * 2D array of tiles.
 */
export class TileLayer<T extends number> implements TileSource<T> {
    tiles: T[][] = [];

    w = 0;
    h = 0;
    // Index of the top left corner of this level. Can move when the level grows.
    x = 0;
    y = 0;

    animCount = 0;

    image: HTMLImageElement | undefined;

    constructor(w: number, h: number) {
        this.w = w;
        this.h = h;

        // Fill with the zero value.
        for (let y = 0; y < this.h; y++) {
            this.tiles[y] = [];

            for (let x = 0; x < this.w; x++) {
                this.tiles[y][x] = 0 as T;
            }
        }
    }

    update(dt: number) {
        this.animCount += dt;
    }

    render(context: CanvasRenderingContext2D) {
        if (!this.image) {
            const imageInfo = Images.images["tiles"];
            if (!imageInfo.loaded) {
                return;
            }
            this.image = imageInfo.image;
        }

        const invMatrix = context.getTransform().inverse();
        const gameMinPoint = invMatrix.transformPoint({ x: 0, y: 0 });
        const gameMaxPoint = invMatrix.transformPoint({
            x: context.canvas.width,
            y: context.canvas.height,
        });

        const minXTile = Math.floor(gameMinPoint.x / TILE_SIZE);
        const minYTile = Math.floor(gameMinPoint.y / TILE_SIZE);
        const maxXTile = Math.floor(gameMaxPoint.x / TILE_SIZE);
        const maxYTile = Math.floor(gameMaxPoint.y / TILE_SIZE);

        for (let y = minYTile; y <= maxYTile; y++) {
            for (let x = minXTile; x <= maxXTile; x++) {
                this.renderTile(context, { x, y });
            }
        }
    }

    renderTile(
        context: CanvasRenderingContext2D,
        pos: Point,
    ) {
        // Logic handled per layer.
    }

    drawTile(
        context: CanvasRenderingContext2D,
        {
            tilePos,
            renderPos,
        }: { tilePos: Point; renderPos: Point }
    ) {
        // Image must be loaded when this is called.
        context.drawImage(
            this.image!,
            tilePos.x * TILE_SIZE_PX,
            tilePos.y * TILE_SIZE_PX,
            TILE_SIZE_PX,
            TILE_SIZE_PX,
            renderPos.x,
            renderPos.y,
            // +1 is a kludge to avoid gaps between tiles.
            TILE_SIZE + 1,
            TILE_SIZE + 1,
        );
    }

    drawQuarterTile(
        context: CanvasRenderingContext2D,
        {
            tilePos,
            subTilePos,
            renderPos,
        }: { tilePos: Point; subTilePos: Point; renderPos: Point }
    ) {
        // Image must be loaded when this is called.
        const halfTileSizePx = TILE_SIZE_PX / 2;
        const halfTileSize = TILE_SIZE / 2;
        context.drawImage(
            this.image!,
            tilePos.x * TILE_SIZE_PX + subTilePos.x * halfTileSizePx,
            tilePos.y * TILE_SIZE_PX + subTilePos.y * halfTileSizePx,
            halfTileSizePx,
            halfTileSizePx,
            renderPos.x + subTilePos.x * halfTileSize,
            renderPos.y + subTilePos.y * halfTileSize,
            // +1 is a kludge to avoid gaps between tiles.
            halfTileSize + 1,
            halfTileSize + 1
        );
    }

    setTile(p: Point, tile: T, {allowGrow = true} = {}) {
        // If out of bounds, extend the board!
        let y = p.y;
        while (allowGrow && y + this.y < 1) {
            this.tiles.unshift(this.tiles[0].slice())
            this.y++;
            this.h++;
        }
        while (allowGrow && y + this.y >= this.h - 1) {
            this.tiles.push(this.tiles[this.h - 1].slice())
            this.h++;
        }

        let x = p.x;
        while (allowGrow && x + this.x < 1) {
            for (let y = 0; y < this.h; y++) {
                this.tiles[y].unshift(this.tiles[y][0]);
            }
            this.x++;
            this.w++;
        }
        while (allowGrow && x + this.x >= this.w - 1) {
            for (let y = 0; y < this.h; y++) {
                this.tiles[y].push(this.tiles[y][this.w - 1]);
            }
            this.w++;
        }

        // Check if we're out of bounds, for when allowGrow is false.
        if (p.x + this.x < 0 || p.y + this.y < 0 || p.x + this.x >= this.w || p.y + this.y >= this.h) {
            throw new Error(`Tile out of bounds: ${p.x}, ${p.y}`);
        }

        this.tiles[p.y + this.y][p.x + this.x] = tile;
    }

    setTileAtCoord(p: Point, tile: T, {allowGrow = true} = {}) {
        this.setTile({
            x: Math.floor(p.x / TILE_SIZE),
            y: Math.floor(p.y / TILE_SIZE),
        }, tile, {allowGrow});
    }

    getTile(p: Point): T {
        let x = Math.min(Math.max(p.x + this.x, 0), this.w - 1);
        let y = Math.min(Math.max(p.y + this.y, 0), this.h - 1);
        return this.tiles[y][x];
    }

    getTileAtCoord(p: Point): T {
        return this.getTile({
            x: Math.floor(p.x / TILE_SIZE),
            y: Math.floor(p.y / TILE_SIZE),
        });
    }

    get minX() {
        return this.x;
    }

    get minY() {
        return this.y;
    }

    get maxX() {
        return this.x + this.w - 1;
    }

    get maxY() {
        return this.y + this.h - 1;
    }
}
