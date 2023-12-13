import { base } from '$app/paths';

import kaboom from 'kaboom';
import type { Key, Asset, SpriteData, Shader, Anchor } from 'kaboom';
import type { Comp, AnchorComp, SpriteComp, PosComp, RotateComp, ZComp } from 'kaboom';
import 'kaboom/global';

type assetAtlas = Asset<Record<string, SpriteData>>;
type shaderAsset = Asset<Shader>;

const resources: { dungeon?: assetAtlas; post?: shaderAsset } = {};

export const createGame = (canvas: HTMLCanvasElement) => {
	kaboom({ canvas });
	loadResources();

	scene('game', gameScene);

	scene('atlas_debug', () => atlasDebug(resources.dungeon!));
	go('game');
};

function loadResources() {
	// https://0x72.itch.io/dungeontileset-ii
	resources.dungeon = loadSpriteAtlas(`${base}/atlas/dungeon.png`, `${base}/atlas/dungeon.json`);

	resources.post = loadShaderURL('background', undefined, `${base}/shaders/background.frag`);
}

export interface SpinComp extends Comp {
	spinning: boolean;
	spin: () => void;
}

function spin(): SpinComp {
	return {
		id: 'spin',
		spinning: false,
		require: ['rotate'],
		update(this: RotateComp & SpinComp) {
			if (this.spinning) {
				this.angle += 1200 * dt();
				if (this.angle >= 360) {
					this.angle = 0;
					this.spinning = false;
				}
			}
		},
		spin() {
			this.spinning = true;
		}
	};
}

function anchorPt(orig: Anchor | Vec2): Vec2 {
	switch (orig) {
		case 'topleft':
			return new Vec2(-1, -1);
		case 'top':
			return new Vec2(0, -1);
		case 'topright':
			return new Vec2(1, -1);
		case 'left':
			return new Vec2(-1, 0);
		case 'center':
			return new Vec2(0, 0);
		case 'right':
			return new Vec2(1, 0);
		case 'botleft':
			return new Vec2(-1, 1);
		case 'bot':
			return new Vec2(0, 1);
		case 'botright':
			return new Vec2(1, 1);
		default:
			return orig;
	}
}

function zAuto(z: number): ZComp {
	return {
		id: 'z',
		z: z,
		require: ['pos', 'anchor', 'sprite'],
		inspect() {
			return `${this.z}`;
		},
		update(this: ZComp & PosComp & AnchorComp & SpriteComp) {
			let anchor = anchorPt(this.anchor).add(1, 1);
			const dim = new Vec2(this.width, this.height);
			anchor = anchor.scale(dim.scale(-0.5));
			const offset = dim.add(anchor);
			this.z = Math.floor(this.pos.y + offset.y);
		}
	};
}

function thing(data: Record<string, SpriteData>) {
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
}

function atlasDebug(atlas: assetAtlas): void {
	atlas.onLoad(thing);
}

function gameScene(): void {
	camScale(4, 4);
	setBackground(Color.GREEN);
	usePostEffect('background');

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

	const player = map.spawn(
		[
			sprite('wizzard_f', { anim: 'idle' }),
			area({ shape: new Rect(vec2(0, 6), 12, 12) }),
			body(),
			anchor('center'),
			tile({}),
			zAuto(0)
		],
		2,
		2
	);

	const sword = player.add([
		pos(-4, 9),
		sprite('weapon_anime_sword'),
		anchor('bot'),
		rotate(0),
		spin()
	]);

	// TODO: z
	const monster = map.spawn(
		[
			sprite('ogre'),
			anchor('bot'),
			area({ scale: 0.5 }),
			body({ isStatic: true }),
			tile({ isObstacle: true }),
			zAuto(0)
		],
		5,
		4
	);
	monster.play('idle');

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
	onKeyPress('space', interact);

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

	onKeyDown('right', () => {
		player.flipX = false;
		sword.flipX = false;
		player.move(SPEED, 0);
		sword.pos = vec2(-4, 9);
	});

	onKeyDown('left', () => {
		player.flipX = true;
		sword.flipX = true;
		player.move(-SPEED, 0);
		sword.pos = vec2(4, 9);
	});

	onKeyDown('up', () => {
		player.move(0, -SPEED);
	});

	onKeyDown('down', () => {
		player.move(0, SPEED);
	});

	onGamepadButtonPress('south', interact);

	onGamepadStick('left', (v) => {
		if (v.x < 0) {
			player.flipX = true;
			sword.flipX = true;
			sword.pos = vec2(4, 9);
		} else if (v.x > 0) {
			player.flipX = false;
			sword.flipX = false;
			sword.pos = vec2(-4, 9);
		}
		player.move(v.scale(SPEED));
		if (v.isZero()) {
			if (player.curAnim() !== 'idle') player.play('idle');
		} else {
			if (player.curAnim() !== 'run') player.play('run');
		}
	});

	const keys: Key[] = ['left', 'right', 'up', 'down'];
	keys.forEach((key: Key) => {
		onKeyPress(key, () => {
			player.play('run');
		});
		onKeyRelease(key, () => {
			if (!isKeyDown('left') && !isKeyDown('right') && !isKeyDown('up') && !isKeyDown('down')) {
				player.play('idle');
			}
		});
	});
}
