import { Game } from "./game/game";

async function init() {
    await Game.preload()

    window.addEventListener('click', hideTitle);
}

function hideTitle() {
    const title = document.querySelector('.title') as HTMLElement;
    title.classList.add('hidden');

    const instructions = document.querySelector('.instructions') as HTMLElement;
    instructions.classList.remove('hidden');

    window.removeEventListener('click', hideTitle);

    const game = new Game('.canvas');
    game.start();
}

window.addEventListener('load', init);