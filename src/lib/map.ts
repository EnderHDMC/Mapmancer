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
	f: {
		floor: '0',
		generator: () => [
			sprite('wall_edge_bottom_left'),
			area({ shape: new Rect(vec2(0), 4, 16) }),
			body({ isStatic: true }),
			tile({ isObstacle: true })
		]
	},
	g: {
		floor: '0',
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
		generator: () => [sprite('floor_stairs'), area(), tile({}), 'stairs']
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

function generateRoom(
	north: boolean,
	south: boolean,
	east: boolean,
	west: boolean,
	stairs: boolean
) {
	const end = stairs ? 'n' : ' ';
	const wes = west ? 'l' : ' ';
	const eas = east ? 'r' : ' ';
	const so0 = south ? 'w' : ' ';
	const so1 = south ? 't' : ' ';
	const so2 = south ? 'w' : 'd';
	const so3 = south ? 'w' : 'c';
	const no0 = north ? 'y' : ' ';
	const no1 = north ? 'w' : ' ';
	const no2 = north ? 'y' : 'g';
	const no3 = north ? 'y' : 'f';
	
	const tiles: string[][] = [
		['q', 'y', 'y', no2, no0, no0, no3, 'y', 'y', 's'],
		['c', 'w', 'w', 'w', no1, no1, 'w', 'w', 'w', 'd'],
		['l', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'r'],
		['l', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'r'],
		[wes, ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', eas],
		[wes, ' ', ' ', ' ', ' ', ' ', ' ', '$', ' ', eas],
		[wes, ' ', ' ', ' ', ' ', ' ', end, ' ', ' ', eas],
		['l', ' ', '$', ' ', ' ', ' ', ' ', 'e', ' ', 'r'],
		['a', 't', 't', 't', so1, so1, 't', 't', 't', 'b'],
		['w', 'w', 'w', so2, so0, so0, so3, 'w', 'w', 'w']
	];
	return tiles.map((r) => r.join(''));
}

function transpose(arr: any[][]) {
	return arr[0].map((_, colIndex) => arr.map((row) => row[colIndex]));
}

function joinRooms(rooms: string[][][]) {
	const rows = rooms.map((room) => {
		const transposed = transpose(room);
		return transposed.map((column, i) => {
			const joiners: { [k: number]: string } = {
				3: 'yy',
				4: 'ww',
				5: '  ',
				6: 'tt',
				7: 'ww'
			};

			let joiner = joiners[i] || '--';
			return column.join(joiner);
		});
	});

	const map = ([] as string[]).concat(...rows);
	return map;
}

function generateMap() {
	randSeed(0);

	const room1 = generateRoom(true, false, false, true, false);
	const room2 = generateRoom(true, false, true, false, false);
	const room3 = generateRoom(false, true, false, true, false);
	const room4 = generateRoom(false, true, true, false, true);
	const rooms = [
		[room1, room2],
		[room3, room4]
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
			y: mapTiles['y'].generator,
			n: mapTiles['n'].generator,
			f: mapTiles['f'].generator,
			g: mapTiles['g'].generator
		}
	});

	return { floor, map };
}

function cleanMap(map: { floor: GameObj<any>; map: GameObj<any> }) {
	map.floor.destroy();
	map.map.destroy();
}

export { generateMap, cleanMap };
