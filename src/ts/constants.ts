import { seededRandom } from "./lib/util";

// Multiple for the fixed-point physics.
export const PHYSICS_SCALE = 16;
export const FPS = 60;
export const TIME_STEP = 1 / FPS;

export const PIXEL_SCALE = 4;

export const GAME_WIDTH_PX = 200; // Quick way to make sure larger levels stay on the screen.
export const GAME_HEIGHT_PX = 150;
export const GAME_WIDTH = GAME_WIDTH_PX * PHYSICS_SCALE;
export const GAME_HEIGHT = GAME_HEIGHT_PX * PHYSICS_SCALE;

export const TILE_SIZE_PX = 16;
export const TILE_SIZE = TILE_SIZE_PX * PHYSICS_SCALE;

export const LEFT_KEYS = ['KeyA', 'ArrowLeft', 'TouchButtonLeft'];
export const RIGHT_KEYS = ['KeyD', 'ArrowRight', 'TouchButtonRight'];
export const JUMP_KEYS = ['KeyW', 'ArrowUp', 'TouchButtonJump'];
// export const DOWN_KEYS = ['KeyS', 'ArrowDown'];
export const PLANT_KEYS = ['KeyS', 'ArrowDown', 'TouchButtonPlant'];
export const SELECT_KEYS = ['Space', 'Enter', 'AnyTouch'];
export const TITLE_KEYS = ['Space', 'Enter', 'AnyTouch'];
export const RESTART_KEYS = ['KeyR', 'TouchButtonRestart'];

export function physFromPx(x: number): number {
    return x * PHYSICS_SCALE;
}

export function pxFromPhys(x: number): number {
    return Math.floor(x / PHYSICS_SCALE);
}

// Not really a constant :)
export const rng = seededRandom("the multistage fitness test is a maximal running test performed on a flat 20 meter distance");

// For visual things that shouldn't impact gameplay.
export const visualRng = seededRandom("Developed in the early 1980's, the multistage fitness test was created to provide a cost-effective and practical prediction of maximal oxygen uptake (V02 max) in children, adolescents, and adults.");
