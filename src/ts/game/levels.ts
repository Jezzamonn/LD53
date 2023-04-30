import { Point } from "../common";
import { Images } from "../lib/images";
import { Sounds } from "../lib/sounds";

export interface LevelInfo {
    name: string;
    song?: string;
    message?: string;
    spawn?: Point;
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
        spawn: { x: 1, y: 5 },
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
                loadTextFile(level.name, 'level/').then(message => level.message = message)
            );
        }

        // Bonus data thing:
        this.fillSongsForward();

        return Promise.all(promises);
    }

    static fillSongsForward() {
        var song: string | undefined;
        for (const level of LEVELS) {
            if (level.song) {
                song = level.song;
            } else {
                level.song = song;
            }
        }
    }

    static saveLevel(levelInfo: LevelInfo) {
        localStorage.setItem('mission-programmable-level', levelInfo.name);
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

/**
 * Loads a test file via a fetch command and returns a promise with the contents of the file.
 *
 * If the file isn't found, just return an empty string for the moment.
 */
function loadTextFile(filename: string, path: string): Promise<string> {
    return fetch(path + filename + '.txt')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            return '';
        });
}