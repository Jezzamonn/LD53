import { Images } from "../lib/images";
import { Sounds } from "../lib/sounds";

export interface LevelInfo {
    name: string;
    song?: string;
}


export const LEVELS: LevelInfo[] = [
    {
        name: 'level1',
    },
    {
        name: 'level2',
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