import type { Anchor } from 'kaboom';
import type { AnchorComp, PosComp, SpriteComp, ZComp } from 'kaboom';

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

function zAuto(): ZComp {
	return {
		id: 'z',
		z: 0,
		require: ['pos', 'anchor', 'sprite'],
		inspect() {
			return `${this.z}`;
		},
		update(this: ZComp & PosComp & AnchorComp & SpriteComp) {
			const dim = new Vec2(this.width, this.height);
			let anchor = anchorPt(this.anchor).add(1, 1);
			anchor = anchor.scale(dim.scale(0.5));

			const offset = dim.sub(anchor);
			this.z = Math.floor(this.pos.y + offset.y);
		}
	};
}

export { zAuto };
