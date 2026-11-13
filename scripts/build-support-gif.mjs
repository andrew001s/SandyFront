import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.resolve('next/package.json'));
const sharp = require('sharp');
const source = fileURLToPath(
	new URL('../assets/support/sandy-coffee-spritesheet.png', import.meta.url),
);
const output = new URL('../public/support/', import.meta.url);
await mkdir(output, { recursive: true });
const { data, info } = await sharp(source)
	.ensureAlpha()
	.raw()
	.toBuffer({ resolveWithObject: true });
const frames = [];
const size = 256;

for (let frame = 0; frame < 16; frame++) {
	const left = Math.round(((frame % 4) * info.width) / 4);
	const top = Math.round((Math.floor(frame / 4) * info.height) / 4);
	const width = Math.round((((frame % 4) + 1) * info.width) / 4) - left;
	const height = Math.round(((Math.floor(frame / 4) + 1) * info.height) / 4) - top;
	let minX = width;
	let minY = height;
	let maxX = 0;
	let maxY = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (data[((top + y) * info.width + left + x) * 4 + 3] < 64) continue;
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}
	}
	if (maxX <= minX || maxY <= minY) throw new Error(`Frame ${frame} is empty`);
	let footMinX = width;
	let footMaxX = 0;
	for (let y = maxY - 8; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			if (data[((top + y) * info.width + left + x) * 4 + 3] < 64) continue;
			footMinX = Math.min(footMinX, x);
			footMaxX = Math.max(footMaxX, x);
		}
	}
	const crop = {
		left: left + minX,
		top: top + minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1,
	};
	const resized = await sharp(data, { raw: info })
		.extract(crop)
		.resize({ height: 232 })
		.png()
		.toBuffer({ resolveWithObject: true });
	const footCenter = (footMinX + footMaxX) / 2 - minX;
	const frameLeft = Math.max(
		0,
		Math.min(size - resized.info.width, Math.round(size / 2 - (footCenter * 232) / crop.height)),
	);
	frames.push(
		await sharp({
			create: {
				width: size,
				height: size,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		})
			.composite([{ input: resized.data, left: frameLeft, top: size - 12 - resized.info.height }])
			.png()
			.toBuffer(),
	);
}

const gif = await sharp({
	create: {
		width: size,
		height: size * frames.length,
		pageHeight: size,
		channels: 4,
		background: { r: 0, g: 0, b: 0, alpha: 0 },
	},
})
	.composite(frames.map((input, index) => ({ input, left: 0, top: index * size })))
	.gif({ loop: 0, delay: Array(frames.length).fill(150), colours: 128, dither: 0.2, effort: 10 })
	.toBuffer();
const metadata = await sharp(gif, { animated: true }).metadata();
if (!metadata.pages || metadata.pages < 2)
	throw new Error('The output must contain multiple animated frames');
if (!metadata.delay?.every((delay) => delay === 150))
	throw new Error('Every frame must last 150 ms');
await writeFile(new URL('sandy-coffee.gif', output), gif);
await writeFile(new URL('sandy-coffee-still.png', output), frames[0]);
process.stdout.write(
	`${JSON.stringify({
		frames: metadata.pages,
		delay: metadata.delay,
		loop: metadata.loop,
		bytes: gif.length,
		hasAlpha: metadata.hasAlpha,
	})}\n`,
);
