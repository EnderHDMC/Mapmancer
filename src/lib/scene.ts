import kaboom, { type Comp, type Key, type RotateComp } from 'kaboom';
import 'kaboom/global';

export const createGame = (canvas: HTMLCanvasElement) => {
	kaboom({ canvas });
	scene('game', gameScene);
	go('game');
};

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

function gameScene(): void {
	loadSpriteAtlas('/atlas/dungeon.png', '/atlas/dungeon.json');

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
			'tttttttttt',
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
					sprite('chest'),
					area(),
					body({ isStatic: true }),
					tile({ isObstacle: true }),
					{ opened: false },
					'chest'
				],
				a: () => [
					sprite('wall_botleft'),
					area({ shape: new Rect(vec2(0), 4, 16) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				b: () => [
					sprite('wall_botright'),
					area({ shape: new Rect(vec2(12, 0), 4, 16) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				c: () => [
					sprite('wall_topleft'),
					area(),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				d: () => [
					sprite('wall_topright'),
					area(),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				w: () => [sprite('wall'), area(), body({ isStatic: true }), tile({ isObstacle: true })],
				t: () => [
					sprite('wall_top'),
					area({ shape: new Rect(vec2(0, 12), 16, 4) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				l: () => [
					sprite('wall_left'),
					area({ shape: new Rect(vec2(0), 4, 16) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				],
				r: () => [
					sprite('wall_right'),
					area({ shape: new Rect(vec2(12, 0), 4, 16) }),
					body({ isStatic: true }),
					tile({ isObstacle: true })
				]
			}
		}
	);

	const player = map.spawn(
		[
			sprite('hero', { anim: 'idle' }),
			area({ shape: new Rect(vec2(0, 6), 12, 12) }),
			body(),
			anchor('center'),
			tile({})
		],
		2,
		2
	);

	const sword = player.add([pos(-4, 9), sprite('sword'), anchor('bot'), rotate(0), spin()]);

	// TODO: z
	map.spawn(
		[
			sprite('ogre'),
			anchor('bot'),
			area({ scale: 0.5 }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		],
		5,
		4
	);

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
