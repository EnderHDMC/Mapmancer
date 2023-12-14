import type { GameObjRaw, GameObj, Key, MergeComps } from 'kaboom';
import type { Comp, AnchorComp, AreaComp, BodyComp, PosComp, SpriteComp } from 'kaboom';

import { zAuto, spin, type SpinComp, type ZAutoComp } from '$lib/components';
import { generateMap, cleanMap } from '$lib/map';
import { resources } from '$lib/resources';

type playerType = GameObjRaw &
	MergeComps<SpriteComp | AreaComp | PosComp | AnchorComp | BodyComp | ZAutoComp | PlayerComp>;

interface PlayerComp extends Comp {
	alive: boolean;
	health: number;
	maxHealth: number;
	gold: number;

	damage: (hitpoints: number) => void;
}

function player(): PlayerComp {
	const maxHealth = 6;
	return {
		id: 'player',
		alive: true,
		health: maxHealth,
		gold: 0,
		maxHealth,
		damage(hitpoints: number) {
			this.health -= hitpoints;
			this.health = Math.max(this.health, 0);
			this.alive = this.health > 0;
		}
	};
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

	onSceneLeave(() => {
		music.stop();
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

	let dungeon = generateMap(0);
	const spawnPos = dungeon.map.tile2Pos(2, 2);

	const playerList = [
		sprite('wizard_f', { anim: 'idle' }),
		area({ shape: new Rect(vec2(0, 6), 12, 12) }),
		pos(spawnPos),
		anchor('center'),
		body(),
		zAuto(),
		player()
	];
	const player1: playerType = add(playerList);

	const sword = player1.add([
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
		if (player1.alive) {
			objA.moveTo(player1.truePos, SPEED);
			objA.flipX = player1.truePos.x < objA.pos.x;

			if (objA.curAnim() !== 'run') objA.play('run');
		} else {
			if (objA.curAnim() !== 'idle') objA.play('idle');
		}
	});

	onCollide('monster', 'player', (a, b) => {
		const objPlayer = b as playerType;
		objPlayer.damage(1);
		objPlayer.play('hit');
		addKaboom(objPlayer.pos, { scale: 0.1 });
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
		for (const col of player1.getCollisions()) {
			const c = col.target as GameObj;
			if (c.is('chest')) {
				if (c.opened) {
					if (!c.full) {
						c.play('close');
						c.opened = false;
					} else {
						c.use(sprite('chest_empty', { frame: 2 }));
						c.full = false;
						player1.gold += 5;
					}
				} else {
					c.play('open');
					c.opened = true;
					interacted = true;
				}
				interacted = true;
			}
			if (c.is('stairs')) {
				cleanMap(dungeon);
				dungeon = generateMap(1);
				player1.moveTo(spawnPos);
				readd(player1);
			}
		}
		return interacted;
	}

	function attack() {
		sword.spin();
	}

	const buffer = new Array(3).fill(0);
	const hearts = buffer.map((_, i) =>
		add([sprite('ui_heart'), pos(12 + (12 + 12 * 4) * i, 12), scale(4), fixed(), z(5000)])
	);

	const goldCoin = add([
		sprite('coin', { anim: 'base' }),
		pos(4, 12 + 12 * 4),
		scale(4),
		fixed(),
		z(5000)
	]);
	const gold = add([text('0'), pos(12 + 8 * 4, 12 + 12 * 4), fixed(), z(5000)]);

	function hpToHeart(health: number, index: number, slots: number) {
		const hpToIndex = index * slots;
		const deltaHp = health - hpToIndex;
		const noHp = 2;
		const fullHp = 0;

		if (health <= hpToIndex) return noHp;
		if (deltaHp >= slots) return fullHp;
		return deltaHp;
	}

	onUpdate(() => {
		gold.text = player1.gold.toString();

		const hp = player1.health;
		hearts.forEach((h, i) => {
			const fill = hpToHeart(hp, i, 2);
			h.frame = fill;
		});

		const gameTime = time();
		resources.post?.data?.bind();
		resources.post?.data?.send({ time: gameTime });
	});

	const SPEED = 120;
	player1.onUpdate(() => {
		camPos(player1.pos);
	});

	player1.onPhysicsResolve(() => {
		// Set the viewport center to player.pos
		camPos(player1.pos);
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

	onKeyPress('z', () => {
		currentControlScheme = 'keyboard';
		interact();
	});
	onKeyPress('x', () => {
		currentControlScheme = 'keyboard';
		attack();
	});

	onKeyDown('right', () => moveKeyboard(Vec2.RIGHT));
	onKeyDown('left', () => moveKeyboard(Vec2.LEFT));
	onKeyDown('up', () => moveKeyboard(Vec2.UP));
	onKeyDown('down', () => moveKeyboard(Vec2.DOWN));

	const keys: Key[] = ['left', 'right', 'up', 'down'];
	keys.forEach((key: Key) => onKeyRelease(key, releaseMove));

	onKeyPress('f3', () => {
		go('atlas_debug');
	});

	function movePlayer(v: Vec2, controller = false) {
		const live = setDeadZone(v);

		if (controller && live) currentControlScheme = 'gamepad';
		if (controller && currentControlScheme !== 'gamepad') return;

		if (live) {
			if (v.x < 0) {
				player1.flipX = true;
				sword.flipX = true;
				sword.pos = vec2(4, 9);
				sword.winding = -1;
			} else if (v.x > 0) {
				player1.flipX = false;
				sword.flipX = false;
				sword.pos = vec2(-4, 9);
				sword.winding = 1;
			}
			player1.move(v.scale(SPEED));

			const anim = player1.curAnim();
			if (anim !== 'run') player1.play('run');
		} else {
			const anim = player1.curAnim();
			if (anim !== 'idle') player1.play('idle');
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

	onGamepadButtonPress('west', () => {
		currentControlScheme = 'gamepad';
		attack();
	});

	onGamepadStick('left', (v) => movePlayer(v, true));

	onGamepadConnect(() => {
		console.log('Connected');
	});
	onGamepadDisconnect(() => {
		console.log('Disconnected');
	});
}

export { gameScene };
