import { Game } from "./game/game";
import { SFX } from "./game/sfx";

async function init() {
    await Game.preload()

    window.addEventListener('click', hideTitle);
}

function hideTitle() {
    const title = document.querySelector('.title') as HTMLElement;
    title.classList.add('hidden');

    const instructions = document.querySelector('.instructions') as HTMLElement;
    instructions.classList.remove('hidden');

    // Only do this after click to prevent the error message that otherwise appears.
    SFX.preload();

    window.removeEventListener('click', hideTitle);

    // Clear the console because the page we're hosting on might have JavaScript warnings.
    console.clear();

    const game = new Game('.canvas');
    game.start();
}

window.addEventListener('load', init);