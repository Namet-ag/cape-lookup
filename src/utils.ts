import Sharp from "sharp";

export async function extractImageRegion(image: Sharp.Sharp, region: Sharp.Region) {
	const newImage = image.clone().extract(region);
	return await newImage.toBuffer();
}

export function blankSharp(width: number, height: number, alpha: boolean) {
	return Sharp({
		create: {
			width,
			height,
			channels: alpha ? 4 : 3,
			background: {
				r: 0,
				g: 0,
				b: 0,
				alpha: 0,
			},
		},
	});
}

// rgb in 0-1 range
export function rgb2hsv(r: number, g: number, b: number) {
	let v = Math.max(r, g, b);
	let c = v - Math.min(r, g, b);
	let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c)); 
	return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

export function dashifyUuid(uuid: string) {
	uuid = uuid.split("-").join("").toLowerCase();
	if (uuid.length != 32) throw `Invalid undashed uuid '${uuid}'`;
	return (
		uuid.substring(0, 8) + "-" + uuid.substring(8, 12) + "-" + uuid.substring(12, 16) + "-" + uuid.substring(16, 20) + "-" + uuid.substring(20)
	);
}