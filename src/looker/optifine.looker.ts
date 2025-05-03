import Axios from "axios";
import { Looker } from "../looker";
import { Profile } from "../types/profile.type";
import { CapeInfo } from "../types/cape-info.type";

export default class OptifineLooker extends Looker {
    protected readonly address: string;

    constructor(options?: {
        id: string,
        address: string
    }) {
        super(options?.id || "optifine");
        this.address = options?.address || "http://107.182.233.85";
    }

    async lookup(profile: Profile): Promise<Omit<CapeInfo, "service">> {
        const url = `${this.address}/capes/${profile.username}.png`;

        const abortController = new AbortController();
        let success = false;

        setTimeout(() => {
            if (!success) {
                abortController.abort();
            }
        }, 5_000);

        const response = await Axios.get(url, {
            responseType: "arraybuffer",
            maxRedirects: 0,
            signal: abortController.signal
        });
        success = true;

        if (response.status != 200) {
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
            assetUrl: null, // optifine servers dont have an asset url for the specific cape, only the current cape that the user is wearing
            creatorUuid: null
        }
    }
}