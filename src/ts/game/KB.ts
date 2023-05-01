export class KB {
    static speak(dialogName: string): void {
        if (!dialogs.hasOwnProperty(dialogName)) {
            // That's fine, just ignore it.
            return;
        }
        console.log(dialogs[dialogName]);
    }

    static async preload() {
        // Something extra.
        await Promise.all([
            this.loadDialog('unlock'),
            this.loadDialog('win'),
            this.loadDialog('after-first-move'),
            this.loadDialog('foundations'),
            this.loadDialog('reload'),
        ]);
    }

    static loadDialog(filename: string): Promise<void> {
        return loadTextFile(filename, 'dialog/').then(text => {
            dialogs[filename] = text;
        });
    }
}

const dialogs: {[key: string]: string} = {};


/**
 * Loads a test file via a fetch command and returns a promise with the contents of the file.
 *
 * If the file isn't found, just return an empty string for the moment.
 */
export function loadTextFile(filename: string, path: string): Promise<string> {
    return fetch(path + filename + '.txt')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            return '';
        });
}