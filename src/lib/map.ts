import type { CompList, GameObj } from 'kaboom';
import { zAuto } from './components';

type tileGen = { floor: string; generator: (pos: Vec2) => CompList<any> };
const mapTiles: { [key: string]: tileGen } = {
	$: {
		floor: '1',
		generator: (a) => {
			console.log(a);
			return [
				sprite('chest_full'),
				area(),
				body({ isStatic: true }),
				tile({ isObstacle: true }),
				{ opened: false, full: true },
				'chest'
			];
		}
	},
	e: {
		floor: '1',
		generator: () => [
			sprite('ogre', { anim: 'idle' }),
			anchor('bot'),
			area({ scale: 0.5 }),
			body({}),
			tile({ isObstacle: true }),
			zAuto(),
			'monster'
		]
	},
	a: {
		floor: '1',
		generator: () => [
			sprite('wall_edge_bottom_left'),
			area({ shape: new Rect(vec2(0), 4, 16) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	b: {
		floor: '1',
		generator: () => [
			sprite('wall_edge_bottom_right'),
			area({ shape: new Rect(vec2(12, 0), 4, 16) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	c: {
		floor: '0',
		generator: () => [
			sprite('wall_edge_left'),
			area(),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	d: {
		floor: '0',
		generator: () => [
			sprite('wall_edge_right'),
			area(),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	w: {
		floor: '0',
		generator: () => [
			sprite('wall_mid'),
			area(),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	t: {
		floor: '1',
		generator: () => [
			sprite('wall_top_mid'),
			area({ shape: new Rect(vec2(0, 12), 16, 4) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	y: {
		floor: '0',
		generator: () => [
			sprite('wall_top_mid'),
			area({ shape: new Rect(vec2(0, 12), 16, 4) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	l: {
		floor: '1',
		generator: () => [
			sprite('wall_edge_mid_left'),
			area({ shape: new Rect(vec2(0), 4, 16) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	r: {
		floor: '1',
		generator: () => [
			sprite('wall_edge_mid_right'),
			area({ shape: new Rect(vec2(12, 0), 4, 16) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	q: {
		floor: '0',
		generator: () => [
			sprite('wall_edge_top_left'),
			area({ shape: new Rect(vec2(0, 12), 16, 4) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	s: {
		floor: '0',
		generator: () => [
			sprite('wall_edge_top_right'),
			area({ shape: new Rect(vec2(0, 12), 16, 4) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	n: {
		floor: '0',
		generator: () => [sprite('floor_stairs'), body({ isStatic: true }), area(), tile()]
	},
	' ': {
		floor: '1',
		generator: () => []
	}
};

function roomToFloor(room: string[]) {
	const tileToFloor = (a: string) => (mapTiles[a] ? mapTiles[a].floor : '0');
	const rowToFloor = (row: string) => [...row].map(tileToFloor).join('');
	const floor = room.map(rowToFloor);
	return floor;
}

function generateRoom(x: number, y: number) {
	const qwe = x === 1 && y === 1 ? 'n' : ' ';
	const tiles: string[][] = [
		['q', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 's'],
		['c', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'd'],
		['l', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'r'],
		['l', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'r'],
		['l', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'r'],
		['l', ' ', ' ', ' ', ' ', ' ', ' ', '$', ' ', 'r'],
		['l', ' ', ' ', ' ', ' ', ' ', qwe, ' ', ' ', 'r'],
		['l', ' ', '$', ' ', ' ', ' ', ' ', 'e', ' ', 'r'],
		['a', 't', 't', 't', 't', 't', 't', 't', 't', 'b'],
		['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w']
	];
	return tiles.map((r) => r.join(''));
}

function transpose(arr: any[][]) {
	return arr[0].map((_, colIndex) => arr.map((row) => row[colIndex]));
}

function joinRooms(rooms: string[][][]) {
	const rows = rooms.map((room) => {
		const transposed = transpose(room);
		return transposed.map((column) => column.join('--'));
	});

	const map = ([] as string[]).concat(...rows);
	return map;
}

function generateMap() {
	randSeed(0);

	const rooms = [
		[generateRoom(0, 0), generateRoom(1, 0)],
		[generateRoom(1, 0), generateRoom(1, 1)]
	];
	const room = joinRooms(rooms);
	const floorMap = roomToFloor(room);
	const floor = addLevel(floorMap, {
		tileWidth: 16,
		tileHeight: 16,
		tiles: {
			'1': () => [sprite('floor', { frame: ~~rand(0, 8) })],
			'0': () => []
		}
	});

	const map = addLevel(room, {
		tileWidth: 16,
		tileHeight: 16,
		tiles: {
			$: mapTiles['$'].generator,
			e: mapTiles['e'].generator,
			a: mapTiles['a'].generator,
			b: mapTiles['b'].generator,
			c: mapTiles['c'].generator,
			d: mapTiles['d'].generator,
			w: mapTiles['w'].generator,
			t: mapTiles['t'].generator,
			l: mapTiles['l'].generator,
			r: mapTiles['r'].generator,
			q: mapTiles['q'].generator,
			s: mapTiles['s'].generator,
			y: mapTiles['y'].generator
		}
	});

	return { floor, map };
}

function cleanMap(map: { floor: GameObj<any>; map: GameObj<any> }) {
	map.floor.destroy();
	map.map.destroy();
}

export { generateMap, cleanMap };
