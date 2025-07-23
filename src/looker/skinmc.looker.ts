import { Looker } from "../looker";
import { CapeInfo } from "../types/cape-info.type";
import { Profile } from "../types/profile.type";
import getAxiosInstance from "../axios-instance";

export default class SkinMCLooker extends Looker {
    constructor() {
        super("skinmc");
    }

    async lookup(entry: Profile): Promise<Omit<CapeInfo, "service">> {
        const response = await getAxiosInstance().get(`https://skinmc.net/api/v1/skinmcCape/${entry.uuid}`, {
            responseType: "arraybuffer"
        });

        if (response.status !== 200) {
            throw new Error(`Invalid status code ${response.status}.`);
        }

        const info = await this.formatCape(response.data);

        return {
            image: info.buffer,
            hasElytra: info.hasElyta,
            name: null,
            description: null,
            frames: info.frames,
            ticksPerFrame: 1,
            dateUploaded: null,
            websiteUrl: null,
            assetUrl: null,
            creatorUuid: null
        }
    }
}