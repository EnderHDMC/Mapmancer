import { base } from '$app/paths';

import kaboom from 'kaboom';
import type { Key, GameObj } from 'kaboom';
import type { PosComp } from 'kaboom';
import type { Asset, SpriteData, Shader, SoundData } from 'kaboom';
import 'kaboom/global';

import { spin, zAuto } from './components';
import type { SpinComp } from './components/spin';

type assetAtlas = Asset<Record<string, SpriteData>>;
type shaderAsset = Asset<Shader>;
type soundAsset = Asset<SoundData>;

const resources: { dungeon?: assetAtlas; post?: shaderAsset; music?: soundAsset } = {};

export const createGame = (canvas: HTMLCanvasElement) => {
	kaboom({ canvas });
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
	// Get the entries in the sprite atlas
	const atlasEntries = Object.keys(data);
	const scale = 512 * 4;
	camScale(2, 2);

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

function generateMap() {
	randSeed(0);
	const floor = addLevel(
		[
			'xxxxxxxxxx',
			'oooooooooo',
			'oooooooooo',
			'oooooooooo',
			'oooooooooo',
			'oooooooooo',
			'oooooooooo',
			'oooooooooo',
			'oooooooooo',
			'oooooooooo'
		],
		{
			tileWidth: 16,
			tileHeight: 16,
			tiles: {
				o: () => [sprite('floor', { frame: ~~rand(0, 8) })]
			}
		}
	);

	const map = addLevel(
		[
			'qtttttttts',
			'cwwwwwwwwd',
			'l        r',
			'l        r',
			'l        r',
			'l      $ r',
			'l        r',
			'l $      r',
			'attttttttb',
			'wwwwwwwwww'
		],
		{
			tileWidth: 16,
			tileHeight: 16,
			tiles: {
				$: () => [
					sprite('chest_empty'),
					area(),
					body({ isStatic: true }),
					tile({ isObstacle: true }),
					{ opened: false },
					'chest'
				],
				a: () => [
					sprite('wall_edge_bottom_left'),
					area({ shape: new Rect(vec2(0), 4, 16) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				b: () => [
					sprite('wall_edge_bottom_right'),
					area({ shape: new Rect(vec2(12, 0), 4, 16) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				c: () => [
					sprite('wall_edge_left'),
					area(),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				d: () => [
					sprite('wall_edge_right'),
					area(),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				w: () => [sprite('wall_mid'), area(), body({ isStatic: true }), tile({ isObstacle: true })],
				t: () => [
					sprite('wall_top_mid'),
					area({ shape: new Rect(vec2(0, 12), 16, 4) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				l: () => [
					sprite('wall_edge_mid_left'),
					area({ shape: new Rect(vec2(0), 4, 16) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				r: () => [
					sprite('wall_edge_mid_right'),
					area({ shape: new Rect(vec2(12, 0), 4, 16) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				q: () => [
					sprite('wall_edge_top_left'),
					area({ shape: new Rect(vec2(0, 12), 16, 4) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				s: () => [
					sprite('wall_edge_top_right'),
					area({ shape: new Rect(vec2(0, 12), 16, 4) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				]
			}
		}
	);

	return { floor, map };
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
		loop: true
	});
	volume(0.5);
	music.play();

	const dungeon = generateMap();

	const player = dungeon.map.spawn(
		[
			sprite('wizard_f', { anim: 'idle' }),
			area({ shape: new Rect(vec2(0, 6), 12, 12) }),
			body(),
			anchor('center'),
			tile({}),
			zAuto(),
			'player'
		],
		2,
		2
	);

	const sword = player.add([
		pos(-4, 9),
		sprite('weapon_anime_sword'),
		anchor('bot'),
		area(),
		rotate(0),
		spin()
	]);

	const monster = dungeon.map.spawn(
		[
			sprite('ogre'),
			anchor('bot'),
			area({ scale: 0.5 }),
			body({}),
			tile({ isObstacle: true }),
			zAuto(),
			'monster'
		],
		5,
		4
	);
	monster.play('idle');

	onUpdate('monster', (a) => {
		const SPEED = 60;

		const objA = a as GameObj<PosComp>;
		objA.moveTo(player.truePos, SPEED);
	});

	onCollide('monster', 'player', (a, b) => {
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
			const c = col.target;
			if (c.is('chest')) {
				if (c.opened) {
					c.play('close');
					c.opened = false;
				} else {
					c.play('open');
					c.opened = true;
				}
				interacted = true;
			}
		}
		if (!interacted) {
			sword.spin();
		}
	}

	onUpdate(() => {
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
