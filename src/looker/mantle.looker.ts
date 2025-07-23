import { Looker } from "../looker";
import { CapeInfo } from "../types/cape-info.type";
import { Profile } from "../types/profile.type";
import getAxiosInstance from "../axios-instance";

export default class MantleLooker extends Looker {
    constructor() {
        super("mantle");
    }

    async lookup(profile: Profile): Promise<Omit<CapeInfo, "service">> {
        const userResponse = await getAxiosInstance().get(`https://api.mantle.gg/users/individual/${profile.uuid}`);
        if (userResponse.status != 200) {
            throw new Error(`Invalid status code ${userResponse.status}.`);
        }

        const user = userResponse.data;

        const capeSlot = user.cosmetics.find(slot => slot.slot == "cape");
        if (!capeSlot || capeSlot.cosmetic.state != "approved") {
            throw new Error("User does not have a cape.");
        }

        const bufferResponse = await getAxiosInstance().get(capeSlot.cosmetic.textureUrl, {
            responseType: "arraybuffer"
        });

        if (bufferResponse.status != 200) {
            throw new Error(`Invalid status code ${bufferResponse.status}.`);
        }

        const info = await this.formatCape(bufferResponse.data);

        return {
            image: info.buffer,
            hasElytra: info.hasElyta,
            name: capeSlot.cosmetic.name,
            description: null,
            frames: info.frames,
            ticksPerFrame: 1,
            dateUploaded: new Date(capeSlot.cosmetic.dateCreated),
            websiteUrl: null,
            assetUrl: capeSlot.cosmetic.textureUrl,
            creator: capeSlot.cosmetic.creator?.uuid || null,
            dataFreshness: new Date()
        };
    }
}