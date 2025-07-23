import { Looker } from "../looker";
import { dashifyUuid } from "../utils";
import { Profile } from "../types/profile.type";
import { CapeInfo } from "../types/cape-info.type";
import getAxiosInstance from "../axios-instance";

type MinecraftCapeInfo = {
    _id: string;
    hash: string;
    title: string;
    author: string;
    type: number;
    downloads: number;
    whitelisted: boolean;
    createdAt: string;
    updatedAt: string;
    total_user_likes: number;
    author_name: string;
    user_liked: boolean;
    type_name: string;
    tags: {
        name: string;
        tag_key: number;
    }[]
};

export default class MinecraftCapesLooker extends Looker {
    constructor() {
        super("minecraft-capes");
    }

    public async lookup(profile: Profile): Promise<Omit<CapeInfo, "service">> {
        const response = await getAxiosInstance().get(`https://api.minecraftcapes.net/profile/${profile.uuid.split("-").join("")}`);

        if (response.status != 200) {
            throw new Error(`Invalid status code ${response.status}.`);
        }

        const buffer = Buffer.from(response.data.textures.cape, "base64");

        const info = await this.formatCape(buffer, (width, height) => {
            return height / width * 2;
        });

        return {
            image: info.buffer,
            hasElytra: info.hasElyta,
            name: null,
            description: null,
            frames: info.frames,
            ticksPerFrame: 2,
            dateUploaded: null,
            websiteUrl: null,
            assetUrl: null,
            creator: null
        }
    }

    public async cron(onCape: (info: Omit<CapeInfo, "service">) => Promise<void>): Promise<void> {
        for (let page = 1; true; page++) {
            console.log(`Minecraft Capes CRON page ${page}`);
            const response = await getAxiosInstance().get(`https://api.minecraftcapes.net/api/gallery/get?page=${page}`);
            if (response.status != 200) {
                throw new Error(`Invalid status code ${response.status}.`);
            }
            
            const capes: MinecraftCapeInfo[] = response.data.data;
            for (let cape of capes) {
                try {
                    if (cape.type_name != "Cape" && cape.type_name != "Animated Cape") {
                        continue;
                    }
                    const assetResponse = await getAxiosInstance().get(`https://api.minecraftcapes.net/api/gallery/${cape.hash}/preview/map`, {
                        responseType: "arraybuffer"
                    });
    
                    const info = await this.formatCape(assetResponse.data, (width, height) => {
                        return height / width * 2;
                    });

                    console.log(`Minecraft Capes CRON submitting "${cape.title}" - https://minecraftcapes.net/gallery/${cape.hash} (by ${dashifyUuid(cape.author)})`);

                    await onCape({
                        image: info.buffer,
                        hasElytra: info.hasElyta,
                        name: cape.title,
                        description: null,
                        frames: info.frames,
                        ticksPerFrame: 2,
                        dateUploaded: new Date(cape.createdAt),
                        websiteUrl: `https://minecraftcapes.net/gallery/${cape.hash}`,
                        assetUrl: `https://api.minecraftcapes.net/api/gallery/${cape.hash}/preview/map`,
                        creator: dashifyUuid(cape.author),
                        dataFreshness: new Date(cape.updatedAt)
                    });
                } catch (e) {
                    console.error(e);
                }
            }

            if (!response.data.hasNextPage) {
                break;
            }
        }
    }
}