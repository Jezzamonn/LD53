import { Images } from "../lib/images";
import { Sounds } from "../lib/sounds";

export interface LevelInfo {
    name: string;
    song?: string;
    message?: string;
}


export const LEVELS: LevelInfo[] = [
    {
        name: 'lobby',
        song: 'spy-basic',
        message: "Hey there! Welcome to the developer console."
    },
    {
        name: 'hall',
    },
    {
        name: 'single-stair',
    },
    {
        name: 'guard',
    },
    {
        name: 'tall-stairs',
    },
    {
        name: 'hallway-with-stairs',
    },
];

export class Levels {
    static preload(): Promise<any> {
        const promises: Promise<any>[] = [];
        for (const level of LEVELS) {
            promises.push(
                Images.loadImage({name: level.name, path: 'level/', extension: 'gif'}),
            );
            if (level.song && Sounds.audios[level.song] === undefined) {
                promises.push(
                    Sounds.loadSound({name: level.song, path: 'music/'}),
                );
            }
        }

        return Promise.all(promises);
    }
}