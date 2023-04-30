import { Point } from "../../common";
import { PHYSICS_SCALE, TILE_SIZE } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { TileLayer } from "./tile-layer";

export enum ObjectTile {
    Empty = 0,
    Spawn = 1,
    Goal = 2,
    LockedBox = 3,
    LockedDoor = 4,
    Keypad = 5,
    Computer = 6,
}

// Position of the tile in the tileset.
const tilePositions = {
    [ObjectTile.Spawn]: { x: 5, y: 2 },
    [ObjectTile.Goal]: { x: 6, y: 2 },
    [ObjectTile.LockedBox]: { x: 5, y: 3 },
    [ObjectTile.LockedDoor]: { x: 7, y: 2 },
    [ObjectTile.Keypad]: { x: 6, y: 3 },
    [ObjectTile.Computer]: { x: 7, y: 3 },
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
