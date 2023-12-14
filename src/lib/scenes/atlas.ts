import type { Atlas, atlasAsset } from '$lib/types/assets';

function atlasDebug(data: Atlas) {
	camScale(2, 2);

	// Get the entries in the sprite atlas
	const atlasEntries = Object.keys(data);
	const scale = 512 * 4;

	// Iterate through the entries and render each one
	atlasEntries.forEach((name) => {
		const animSet = data[name];

		const entries = Object.entries(animSet.anims);
		if (entries.length) {
			entries.forEach(([anim, animData]: [string, any]) => {
				const frame = animData.from;
				const x = animSet.frames[frame].x * scale;
				const y = animSet.frames[frame].y * scale;

				const demo = add([sprite(name), area(), pos(x, y)]);
				demo.play(anim, { loop: true });
			});
		} else {
			animSet.frames.forEach((frame, index) => {
				const x = frame.x * scale;
				const y = frame.y * scale;

				add([sprite(name, { frame: index }), area(), pos(x, y)]);
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

	function playerMove(v: Vec2) {
		const mov = v.scale(SPEED);
		player.move(mov);
	}
	onKeyDown('right', () => playerMove(RIGHT));
	onKeyDown('left', () => playerMove(LEFT));
	onKeyDown('up', () => playerMove(UP));
	onKeyDown('down', () => playerMove(DOWN));
	onKeyDown('f2', () => go('game'));
}

function atlasDebugScene(atlas: atlasAsset): void {
	atlas.onLoad(atlasDebug);
}

export { atlasDebugScene };
