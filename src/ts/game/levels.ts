import { Point } from "../common";
import { Images } from "../lib/images";
import { Sounds } from "../lib/sounds";
import { KB } from "./KB";

export interface LevelInfo {
    name: string;
    song?: string;
    message?: string;
}


export const LEVELS: LevelInfo[] = [
    {
        name: 'lobby',
        song: 'spy-basic',
    },
    {
        name: 'hall',
    },
    {
        name: 'hall-left',
    },
    {
        name: 'single-stair',
    },
    {
        name: 'guard',
        song: 'spy-normal',
    },
    {
        name: 'tall-stairs',
    },
    {
        name: 'multiple-stairs',
    },
    {
        name: 'c-shape-stairs',
    },
    {
        name: 'snake',
    },
    {
        name: 'snake2',
    },
    {
        name: 'kingbox',
        song: '',
    },
];

export class Levels {
    static preload(): Promise<any> {
        const promises: Promise<any>[] = [];
        for (const level of LEVELS) {
            promises.push(
                Images.loadImage({name: level.name, path: 'level/', extension: 'gif'}),
            );
            if (level.song && level.song.length > 0 && Sounds.audios[level.song] === undefined) {
                promises.push(
                    Sounds.loadSound({name: level.song, path: 'music/'}),
                );
            }
            promises.push(
                KB.loadDialog(level.name)
            );
        }

        // Bonus data thing:
        this.fillSongsForward();

        return Promise.all(promises);
    }

    static fillSongsForward() {
        var song: string | undefined;
        for (const level of LEVELS) {
            if (level.song != undefined) {
                song = level.song;
            } else {
                level.song = song;
            }
        }
    }

    static saveLevel(levelInfo: LevelInfo) {
        localStorage.setItem('mission-programmable-level', levelInfo.name);
    }

    static clearSavedLevel() {
        localStorage.removeItem('mission-programmable-level');
    }

    static getSavedLevelIndex(): number {
        const savedLevelName = localStorage.getItem('mission-programmable-level');
        if (savedLevelName) {
            for (let i = 0; i < LEVELS.length; i++) {
                if (LEVELS[i].name === savedLevelName) {
                    return i;
                }
            }
        }
        return 0;
    }
}
