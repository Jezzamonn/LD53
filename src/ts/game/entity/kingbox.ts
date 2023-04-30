import { PHYSICS_SCALE, physFromPx } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { KB } from "../KB";
import { Level } from "../level";
import { Robot, RobotAction } from "./robot";

export class KingBox extends Robot {
    constructor(level: Level) {
        super(level);
        this.emoji = '👑';
        this.imageName = 'kingbox';

        this.w = physFromPx(14);
        this.h = physFromPx(8);
    }

    exportActionsToGlobal(): void {
        super.exportActionsToGlobal();
        (window as any).destroy = (argument: any) => {
            // Hello! If you're seeing this message, you typed "destroy" without adding the parentheses at the end. To call the function, type "destroy()".
            if (argument !== undefined) {
                console.warn(`${this.emoji}: Warning: destroy() does not take any arguments. I will destroy only once.`);
            }
            return this.queueAction(RobotAction.Destroy);
        }
    }

    // The jump that happens when the kingbox spawns.
    spawnJump() {
        this.startJump();
        this.dy *= 0.5;

        KB.speak('unlock');
    }

    getAnimationName(): string {
        if (this.currentAction?.action == RobotAction.Destroy) {
            return 'eat';
        }
        return super.getAnimationName();
    }

    static async preload(): Promise<void> {
        Aseprite.loadImage({ name: 'kingbox', basePath: "sprites" });
    }
}