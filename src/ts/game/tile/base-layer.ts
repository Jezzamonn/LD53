import { Point } from "../../common";
import { TILE_SIZE } from "../../constants";
import { TileLayer } from "./tile-layer";

export enum BaseTile {
    Outside = 0,
    Wall = 1,
    Background = 2,
    Unknown = 3, // Used temporarily when creating the level... maybe? Might be less relevant now.
    Stairs = 4,
    Ground = 5,
    Darkness = 6,
}

// Position of the tile in the tileset.
const tilePositions = {
    [BaseTile.Wall]: { x: 0, y: 0 },
    [BaseTile.Background]: { x: 1, y: 0 },
    [BaseTile.Stairs]: { x: 3, y: 1 },
    [BaseTile.Ground]: { x: 0, y: 1 },
    [BaseTile.Darkness]: { x: 1, y: 1 },
}

export class BaseLayer extends TileLayer<BaseTile> {

    constructor(w: number, h: number) {
        super(w, h);
    }

    fillInUnknownTiles() {
        for (let y = this.minY; y <= this.maxY; y++) {
            for (let x = this.minX; x <= this.maxX; x++) {
                if (this.getTile({x, y}) == BaseTile.Unknown) {
                    // console.log('filling in unknown tile', x, y)
                    // Unknown tiles are filled based on the tile to the left and right.
                    const horizontalTiles = [
                        this.getTile({ x: x - 1, y }),
                        this.getTile({ x: x + 1, y }),
                    ];

                    let newTile = this.pickTileToFillUnknown(horizontalTiles);

                    this.setTile({x, y}, newTile);
                }
            }
        }
    }

    pickTileToFillUnknown(neighbors: BaseTile[]): BaseTile {
        // Filter out walls.
        const filteredNeighbors = neighbors.filter((tile) => tile != BaseTile.Wall);
        // Sort them (sort of a hack but works ok).
        const sortedNeighbors = filteredNeighbors.sort();
        // Because there's just two, we don't need to do the whole sorting thing... just pick the first.
        // If this is empty, there are two walls. We use the background tile for that case.
        return sortedNeighbors.length > 0 ? sortedNeighbors[0] : BaseTile.Background;
    }

    renderTile(
        context: CanvasRenderingContext2D,
        pos: Point,
    ) {
        const tile = this.getTile(pos);
        const renderPos = {x: pos.x * TILE_SIZE, y: pos.y * TILE_SIZE }

        if (tilePositions.hasOwnProperty(tile)) {
            this.drawTile(context, {tilePos: tilePositions[tile], renderPos});
            return;
        }

        switch (tile) {
            case BaseTile.Outside:
                // If empty is next to a wall or a background tile, draw the little windowy wall piece.
                const rightTile = this.getTile({x: pos.x + 1, y: pos.y});
                const leftTile = this.getTile({x: pos.x - 1, y: pos.y});

                if (rightTile != BaseTile.Outside) {
                    this.drawTile(context, {tilePos: {x: 5, y: 0}, renderPos});
                }
                else if (leftTile != BaseTile.Outside) {
                    this.drawTile(context, {tilePos: {x: 6, y: 0}, renderPos});
                }
                break;
        }
    }

}