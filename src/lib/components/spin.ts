import type { Comp, RotateComp } from "kaboom";

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

export { spin };
