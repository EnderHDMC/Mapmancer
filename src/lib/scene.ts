import { base } from '$app/paths';

import kaboom from 'kaboom';
import type { Key, GameObj, GameObjRaw } from 'kaboom';
import type { PosComp, SpriteComp } from 'kaboom';
import type { Asset, SpriteData, Shader, SoundData } from 'kaboom';
import 'kaboom/global';

import { cleanMap, generateMap } from './map';

import { spin, zAuto } from './components';
import type { SpinComp } from './components/spin';

type assetAtlas = Asset<Record<string, SpriteData>>;
type shaderAsset = Asset<Shader>;
type soundAsset = Asset<SoundData>;

const resources: { dungeon?: assetAtlas; post?: shaderAsset; music?: soundAsset } = {};

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

function atlasDebug(data: Record<string, SpriteData>) {
	camScale(2, 2);

	// Get the entries in the sprite atlas
	const atlasEntries = Object.keys(data);
	const scale = 512 * 4;

	// Iterate through the entries and render each one
	atlasEntries.forEach((entry) => {
		// Calculate the position for each sprite
		const ad = data[entry];

		const entries = Object.entries(ad.anims);
		if (entries.length) {
			entries.forEach(([a, b]: [string, any]) => {
				const frame = b.from;
				const x = ad.frames[frame].x * scale;
				const y = ad.frames[frame].y * scale;

				const demo = add([sprite(entry), area(), pos(x, y)]);
				demo.play(a, { loop: true });
			});
		} else {
			ad.frames.forEach((qwe, frame) => {
				const x = qwe.x * scale;
				const y = qwe.y * scale;

				add([sprite(entry, { frame }), area(), pos(x, y)]);
			});
		}
	});

	const player = add([
		pos(512, 0) // position in world
	]);
	const SPEED = 480;
	player.onUpdate(() => {
		camPos(player.pos);
	});

	onKeyDown('right', () => {
		player.move(SPEED, 0);
	});

	onKeyDown('left', () => {
		player.move(-SPEED, 0);
	});

	onKeyDown('up', () => {
		player.move(0, -SPEED);
	});

	onKeyDown('down', () => {
		player.move(0, SPEED);
	});

	onUpdate(() => {
		const gameTime = time();
		resources.post?.data?.bind();
		resources.post?.data?.send({ time: gameTime });
	});
}

function atlasDebugScene(atlas: assetAtlas): void {
	atlas.onLoad(atlasDebug);
}

function setDeadZone(a: Vec2) {
	const DEADZONE = 0.25;

	// If stick value is smaller than dead zone, give it a value of 0
	// Math.abs() makes it work regardless of positive or negative value
	const magnitude = a.len();
	if (magnitude < 0.25) {
		a.x = 0;
		a.y = 0;
	} else {
		const b = a.unit().scale((magnitude - DEADZONE) / (1 - DEADZONE));
		a.x = b.x;
		a.y = b.y;
	}

	return magnitude >= DEADZONE;
}

function gameScene(): void {
	camScale(4, 4);
	setBackground(Color.GREEN);
	usePostEffect('background');

	const music = play('OtherworldlyFoe', {
		loop: true,
		volume: 0.5,
		paused: true
	});

	// A hacky way to get audio working
	// We play the music on interaction.
	let startedAudio = false;
	onKeyDown((a) => {
		if (music.paused && !startedAudio) {
			music.play();
			startedAudio = true;
		}
	});

	let dungeon = generateMap();
	const spawnPos = dungeon.map.tile2Pos(2, 2);
	const playerList = [
		sprite('wizard_f', { anim: 'idle' }),
		area({ shape: new Rect(vec2(0, 6), 12, 12) }),
		pos(spawnPos),
		body(),
		anchor('center'),
		tile({}),
		zAuto(),
		'player',
		{ alive: true, gold: 0 }
	];
	const player = add(playerList);

	const sword = player.add([
		pos(-4, 9),
		sprite('weapon_anime_sword'),
		anchor('bot'),
		area(),
		rotate(0),
		spin()
	]);

	onUpdate('monster', (a) => {
		const SPEED = 60;
		const objA = a as GameObjRaw & PosComp & SpriteComp;
		if (player.alive) {
			objA.moveTo(player.truePos, SPEED);
			objA.flipX = player.truePos.x < objA.pos.x;

			if (objA.curAnim() !== 'run') objA.play('run');
		} else {
			if (objA.curAnim() !== 'idle') objA.play('idle');
		}
	});

	onCollide('monster', 'player', (a, b) => {
		b.alive = false;
		b.destroy();
		addKaboom(b.pos, { scale: 0.1 });
	});

	onCollide('spin', 'monster', (a, b) => {
		const objA = a as GameObj<SpinComp>;
		const objB = b as GameObj<any>;

		if (objA.spinning) {
			addKaboom(objB.pos, { scale: 0.1 });
			objB.destroy();
		}
	});

	function interact() {
		let interacted = false;
		for (const col of player.getCollisions()) {
			const c = col.target as GameObj;
			if (c.is('chest')) {
				if (c.opened) {
					if (!c.full) {
						c.play('close');
						c.opened = false;
					} else {
						c.use(sprite('chest_empty', { frame: 2 }));
						c.full = false;
						player.gold += 5;
					}
				} else {
					c.play('open');
					c.opened = true;
				}
				interacted = true;
			}
			if (c.is('stairs')) {
				readd(player);
				cleanMap(dungeon);
				dungeon = generateMap();
				player.moveTo(spawnPos);
			}
		}
		if (!interacted) {
			sword.spin();
		}
	}

	const buffer = new Array(3).fill(0);
	const hearts = buffer.map((a, i) =>
		add([sprite('ui_heart'), pos(12 + (12 + 12 * 4) * i, 12), scale(4), fixed()])
	);

	const goldCoin = add([sprite('coin', { anim: 'base' }), pos(4, 12 + 12 * 4), scale(4), fixed()]);
	const gold = add([text('0'), pos(12 + 8 * 4, 12 + 12 * 4), fixed()]);

	function hpToHeart(health: number, index: number, slots: number) {
		const hpToIndex = index * slots;
		const deltaHp = health - hpToIndex;
		const noHp = 2;
		const fullHp = 0;

		if (health <= hpToIndex) return noHp;
		if (deltaHp >= slots) return fullHp;
		return deltaHp;
	}

	let hp = 3;
	onUpdate(() => {
		gold.text = player.gold.toString();
		hearts.forEach((h, i) => {
			const qwe = hpToHeart(hp, i, 2);
			console.info(0);
			h.frame = qwe;
		});

		const gameTime = time();
		resources.post?.data?.bind();
		resources.post?.data?.send({ time: gameTime });
	});

	const SPEED = 120;
	player.onUpdate(() => {
		camPos(player.pos);
	});

	player.onPhysicsResolve(() => {
		// Set the viewport center to player.pos
		camPos(player.pos);
	});

	let currentControlScheme: 'keyboard' | 'gamepad' = 'keyboard';
	function moveKeyboard(v: Vec2) {
		currentControlScheme = 'keyboard';
		movePlayer(v, false);
	}
	function releaseMove() {
		currentControlScheme = 'keyboard';
		if (!isKeyDown('left') && !isKeyDown('right') && !isKeyDown('up') && !isKeyDown('down')) {
			const zeroVec2 = new Vec2(0, 0);
			movePlayer(zeroVec2, false);
		}
	}

	onKeyPress('space', () => {
		currentControlScheme = 'keyboard';
		interact();
	});
	onKeyDown('right', () => moveKeyboard(Vec2.RIGHT));
	onKeyDown('left', () => moveKeyboard(Vec2.LEFT));
	onKeyDown('up', () => moveKeyboard(Vec2.UP));
	onKeyDown('down', () => moveKeyboard(Vec2.DOWN));

	const keys: Key[] = ['left', 'right', 'up', 'down'];
	keys.forEach((key: Key) => onKeyRelease(key, releaseMove));

	onKeyPress('f2', () => {
		music.stop();
		go('atlas_debug');
	});

	function movePlayer(v: Vec2, controller = false) {
		const live = setDeadZone(v);

		if (controller && live) currentControlScheme = 'gamepad';
		if (controller && currentControlScheme !== 'gamepad') return;

		if (live) {
			if (v.x < 0) {
				player.flipX = true;
				sword.flipX = true;
				sword.pos = vec2(4, 9);
				sword.winding = -1;
			} else if (v.x > 0) {
				player.flipX = false;
				sword.flipX = false;
				sword.pos = vec2(-4, 9);
				sword.winding = 1;
			}
			player.move(v.scale(SPEED));

			if (player.curAnim() !== 'run') player.play('run');
		} else {
			if (player.curAnim() !== 'idle') player.play('idle');
		}
	}

	onGamepadButtonPress((b) => {
		console.log(b);
		return b;
	});

	onGamepadButtonPress('south', () => {
		currentControlScheme = 'gamepad';
		interact();
	});

	onGamepadStick('left', (v) => movePlayer(v, true));

	onGamepadConnect(() => {
		console.log('Connected');
	});
	onGamepadDisconnect(() => {
		console.log('Disconnected');
	});
}
