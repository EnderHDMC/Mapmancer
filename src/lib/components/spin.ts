import type { Comp, RotateComp } from 'kaboom';

export interface SpinComp extends Comp {
	spinning: boolean;
	winding: number;
	spin: () => void;
}

function spin(): SpinComp {
	return {
		id: 'spin',
		spinning: false,
		winding: 1,
		require: ['rotate'],
		update(this: RotateComp & SpinComp) {
			if (this.spinning) {
				this.angle += this.winding * 1200 * dt();
				if (Math.abs(this.angle) >= 360) {
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
