import { Looker } from "../looker";
import { CapeInfo } from "../types/cape-info.type";
import { Profile } from "../types/profile.type";
import getAxiosInstance from "../axios-instance";

type SkinMCCapeMetadata = {
	name: string | null;
	description: string | null;
	websiteUrl: string | null;
};

export default class SkinMCLooker extends Looker {
	constructor() {
		super("skinmc");
	}

	async lookup(entry: Profile): Promise<Omit<CapeInfo, "service">> {
		const capeUrl = `https://skinmc.net/api/v1/skinmcCape/${entry.uuid}`;

		const [response, metadataResponse] = await Promise.all([
			getAxiosInstance().get(capeUrl, {
				responseType: "arraybuffer",
			}),
			getAxiosInstance().get<SkinMCCapeMetadata>(
				`${capeUrl}/metadata`
			),
		]);

		if (response.status !== 200) {
			throw new Error(
				`Invalid cape status code ${response.status}.`
			);
		}

		if (metadataResponse.status !== 200) {
			throw new Error(
				`Invalid metadata status code ${metadataResponse.status}.`
			);
		}

		const info = await this.formatCape(response.data);
		const metadata = metadataResponse.data;

		return {
			image: info.buffer,
			hasElytra: info.hasElyta,
			name: metadata.name ?? null,
			description: metadata.description ?? null,
			frames: info.frames,
			ticksPerFrame: 1,
			dateUploaded: null,
			websiteUrl: metadata.websiteUrl ?? null,
			assetUrl: null,
			creator: null,
			dataFreshness: new Date(),
		};
	}
}
