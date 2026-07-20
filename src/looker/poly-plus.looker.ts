import getAxiosInstance from "../axios-instance";
import { Looker } from "../looker";
import { CapeInfo } from "../types/cape-info.type";
import { Profile } from "../types/profile.type";

interface PolyPlusBaseCosmetic {
	id: number;
	type: string;
	name: string;
	allowed_slots: string[];
}

interface PolyPlusCosmeticVariant extends PolyPlusBaseCosmetic {
	url: string;
	cover_url: string;
	hash: string;
}

interface PolyPlusCosmetic extends PolyPlusBaseCosmetic {
	variants: PolyPlusCosmeticVariant[];
}

interface PolyPlusPlayer {
	cosmetics: PolyPlusCosmetic[];
	equipped: {
		cape?: number;
	};
}

export default class PolyPlusLooker extends Looker {
	constructor() {
		super("poly-plus");
	}

	public async lookup(profile: Profile): Promise<Omit<CapeInfo, "service">> {
		const { data } = await getAxiosInstance().get<PolyPlusPlayer>(
			`https://plus.polyfrost.org/cosmetics/player?player=${profile.uuid}`
		);

		const capeId = data.equipped.cape;
		if (typeof capeId !== "number") {
			throw new Error("No cape equipped");
		}

		for (const cosmetic of data.cosmetics) {
			if (cosmetic.type != "cape") {
				continue;
			}

			for (const variant of cosmetic.variants) {
				if (variant.id == capeId) {
					const { data: rawImage } = await getAxiosInstance().get<Buffer>(
						variant.url,
						{
							responseType: "arraybuffer",
						}
					);

					const info = await this.formatCape(rawImage);

					return {
						image: info.buffer,
						hasElytra: info.hasElyta,
						name: variant.name,
						description: null,
						frames: info.frames,
						ticksPerFrame: 1, // todo: see if accurate
						dateUploaded: null,
						websiteUrl: `https://store.polyfrost.org/item/${variant.id}`,
						assetUrl: variant.url,
						creator: null,
					};
				}
			}
		}

		throw new Error("Cape not found");
	}
}
