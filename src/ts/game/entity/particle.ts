import { Level } from "../level";
import { Entity } from "./entity";

export class Particle extends Entity {

    lifeTime = 0;

    constructor(level: Level) {
        super(level);

        this.canCollide = false;
    }

    update(dt: number): void {
        super.update(dt);

        this.lifeTime -= dt;
        if (this.lifeTime <= 0) {
            this.done = true;
        }
    }

    render(context: CanvasRenderingContext2D): void {
        super.render(context);
    }
}