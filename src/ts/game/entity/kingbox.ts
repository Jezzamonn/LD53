import { PHYSICS_SCALE, physFromPx } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
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
        (window as any).eat = (argument: any) => {
            // Hello! If you're seeing this message, you typed "eat" without adding the parentheses at the end. To call the function, type "eat()".
            if (argument !== undefined) {
                console.warn(`${this.emoji}: Warning: eat() does not take any arguments. I will destroy only once.`);
            }
            return this.queueAction(RobotAction.Eat);
        }
    }

    getAnimationName(): string {
        if (this.currentAction?.action == RobotAction.Eat) {
            return 'eat';
        }
        return super.getAnimationName();
    }

    static async preload(): Promise<void> {
        Aseprite.loadImage({ name: 'kingbox', basePath: "sprites" });
    }
}