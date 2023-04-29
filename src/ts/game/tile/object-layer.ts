import { Point } from "../../common";
import { PHYSICS_SCALE, TILE_SIZE } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { TileLayer } from "./tile-layer";

export enum ObjectTile {
    Empty = 0,
    Spawn = 1,
    Goal = 2,
}

// Position of the tile in the tileset.
const tilePositions = {
    [ObjectTile.Spawn]: { x: 5, y: 2 },
    [ObjectTile.Goal]: { x: 6, y: 2 },
}

export class ObjectLayer extends TileLayer<ObjectTile> {

    renderTile(context: CanvasRenderingContext2D, pos: Point): void {
        const tile = this.getTile(pos);
        const renderPos = {x: pos.x * TILE_SIZE, y: pos.y * TILE_SIZE }

        const tilePos = tilePositions[tile];
        if (!tilePos) {
            return;
        }

        this.drawTile(context, {tilePos, renderPos});
    }
}
