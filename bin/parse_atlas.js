import { readFileSync, writeFileSync } from 'fs';

// Read frame info from a file
const frameInfoFilePath = 'dungeon.info';
const frameOutputPath = 'dungeon.json';
const frameInfo = readFileSync(frameInfoFilePath, 'utf-8');

// Split the frame info into lines
const lines = frameInfo.trim().split('\n');

// Create an empty object to store the parsed data
const animationAtlas = {};

// Iterate through each line and parse the data
const lineCount = lines.length;
let lineIndex = 0;

function setAnimationData(name, key, data) {
	switch (key) {
		case 'idle':
			data.speed = 3;
			data.loop = true;
			break;
		case 'run':
			data.speed = 10;
			data.loop = true;
			break;
		case 'open':
			data.speed = 20;
			data.loop = false;
			break;
		case 'close':
			data.speed = 20;
			data.loop = false;
			break;
		case 'hit':
			data.speed = 20;
			data.loop = false;
			break;
		case 'base':
			switch (name) {
				case 'coin':
					data.loop = true;
					break;
				default:
					console.error(`Unhandled animation: ${name}[${key}]`);
					break;
			}
			break;
		default:
			console.error(`Unhandled animation: ${name}[${key}]`);
			break;
	}
}

function PeekLine() {
	const line = lines[lineIndex];
	let [name, x, y, width, height] = line.trim().split(/\s+/);
	x = parseInt(x, 10);
	y = parseInt(y, 10);
	width = parseInt(width, 10);
	height = parseInt(height, 10);

	return { name, x, y, width, height };
}

function ReadLine() {
	const read = PeekLine();
	lineIndex++;
	return read;
}

function SameName(name) {
	if (lineIndex >= lineCount) return false;
	const read = PeekLine();
	return read.name.startsWith(name);
}

function processSlices(slicesX, slicesY, sliceX, sliceY, name) {
	const minX = slicesX.size ? Math.min(...slicesX.values()) : 0;
	const minY = slicesY.size ? Math.min(...slicesY.values()) : 0;
	if (sliceX < minX) console.error(`Unexptected min x: ${name}`);
	if (sliceY < minY) console.error(`Unexptected min y: ${name}`);
	slicesX.add(sliceX);
	slicesY.add(sliceY);
}

function parseAnimationFull(read, data) {
	const animationPattern = '_anim_(\\w+)(_f\\d+)';
	let animationMatch = read.name.match(animationPattern);

	if (animationMatch) {
		lineIndex--;
		const animations = {};
		let count = 0;
		read.name = animationMatch.input.replace(animationMatch[0], '');

		const slicesX = new Set();
		const slicesY = new Set();
		while (SameName(read.name)) {
			const next = ReadLine();
			processSlices(slicesX, slicesY, next.x, next.y, read.name);

			animationMatch = next.name.match(animationPattern);
			const animationKey = animationMatch[1];
			const animationData = animations[animationKey] || { from: count };
			animationData.to = count;
			animations[animationKey] = animationData;
			if (count >= slicesX.size) {
				animationData.from = slicesX.size - 1;
				animationData.to = animationData.from - (count % slicesX.size);
				console.warn(`WARNING! ${read.name}`);
			}

			const nameWithKey = animationMatch.input.replace(animationMatch[2], '');
			if (!SameName(nameWithKey)) {
				setAnimationData(read.name, animationKey, animationData);
			}

			count++;
		}

		if (slicesX.size > 1) data.sliceX = slicesX.size;
		if (slicesY.size > 1) data.sliceY = slicesY.size;
		data.width *= slicesX.size;
		data.anims = animations;

		console.log(`ANIMATION (FULL): ${read.name}: ${count}`);
	}

	return Boolean(animationMatch);
}

function parseAnimationSimple(read, data) {
	const animationPattern = '(_anim)?(_f\\d+)';
	let animationMatch = read.name.match(animationPattern);

	if (animationMatch) {
		lineIndex--;
		const animations = {};
		let count = 0;
		read.name = animationMatch.input.replace(animationMatch[0], '');

		const slicesX = new Set();
		const slicesY = new Set();
		while (SameName(read.name)) {
			const next = ReadLine();
			processSlices(slicesX, slicesY, next.x, next.y, read.name);

			animationMatch = next.name.match(animationPattern);
			const animationKey = 'base';
			const animationData = animations[animationKey] || { from: count };
			animationData.to = count;
			animations[animationKey] = animationData;

			const nameWithKey = animationMatch.input.replace(animationMatch[2], '');
			if (!SameName(nameWithKey)) {
				setAnimationData(read.name, animationKey, animationData);
			}

			count++;
		}

		if (slicesX.size > 1) data.sliceX = slicesX.size;
		if (slicesY.size > 1) data.sliceY = slicesY.size;
		data.width *= slicesX.size;
		data.height *= slicesY.size;
		data.anims = animations;

		console.log(`ANIMATION (SIMPLE): ${read.name}: ${count}`);
	}

	return Boolean(animationMatch);
}

function parseVariant(read, data) {
	const variantPattern = '_(\\d)';
	const variantMatch = read.name.match(variantPattern);

	if (variantMatch) {
		lineIndex--;
		let count = 0;
		read.name = read.name.replace(variantMatch[0], '');

		const slicesX = new Set();
		const slicesY = new Set();
		while (SameName(read.name)) {
			const next = ReadLine();
			processSlices(slicesX, slicesY, next.x, next.y, read.name);

			count++;
		}

		if (slicesX.size > 1) data.sliceX = slicesX.size;
		if (slicesY.size > 1) data.sliceY = slicesY.size;
		data.width *= slicesX.size;
		data.height *= slicesY.size;

		console.log(`VARIANT: ${read.name}: ${count}`);
	}

	return Boolean(variantMatch);
}

while (lineIndex < lineCount) {
	const read = ReadLine();
	const data = {};
	data.x = read.x;
	data.y = read.y;
	data.width = read.width;
	data.height = read.height;

	let handled = false;
	handled |= handled || parseAnimationFull(read, data);
	handled |= handled || parseAnimationSimple(read, data);
	handled |= handled || parseVariant(read, data);
	if (!handled) console.log(`DEFAULT: ${read.name}`);

	// Add the sprite data to the parsed object
	if (animationAtlas[read.name]) console.error(`Already there! ${read.name}`);
	animationAtlas[read.name] = data;
}

// Convert the parsed data to JSON format
const jsonData = JSON.stringify(animationAtlas, null, 0);
writeFileSync(frameOutputPath, jsonData);
