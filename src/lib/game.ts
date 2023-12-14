import { base } from '$app/paths';

import kaboom from 'kaboom';
import 'kaboom/global';

import { atlasDebugScene } from './scenes/atlas';
import { gameScene } from './scenes/game';
import { resources } from './resources';

export const createGame = (canvas: HTMLCanvasElement) => {
	kaboom({ canvas, focus: true });
	loadResources();

	scene('game', gameScene);

	scene('atlas_debug', () => atlasDebugScene(resources.dungeon!));
	go('game');
};

function loadResources() {
	// https://0x72.itch.io/dungeontileset-ii
	resources.dungeon = loadSpriteAtlas(`${base}/atlas/dungeon.png`, `${base}/atlas/dungeon.json`);

	resources.post = loadShaderURL('background', undefined, `${base}/shaders/background.frag`);

	resources.music = loadSound('OtherworldlyFoe', `${base}/sounds/OtherworldlyFoe.mp3`);
}
