import { Looker } from "../looker";
import Axios from "axios";
import * as FS from "fs";
import * as Crypto from "crypto";
import { CapeInfo } from "../types/cape-info.type";
import { Profile } from "../types/profile.type";
import getAxiosInstance from "../axios-instance";

export default class OfficialLooker extends Looker {
    private readonly urls = new Map<string, string>();
    private readonly hashes = new Map<string, string>();

    constructor() {
        super("official");
    }

    async prepare() {
        const directories = FS.readdirSync("./official-capes");
        for (const dir of directories) {
            const capes = FS.readdirSync(`./official-capes/${dir}`);
            for (const fileName of capes) {
                if (!fileName.endsWith(".png")) {
                    continue;
                }
                const name = `${fileName.substring(0, fileName.length - 4)} Cape`;
                const buffer = FS.readFileSync(`./official-capes/${dir}/${fileName}`);
                const info = await this.formatCape(buffer);

                const hash = Crypto.createHash("sha256").update(info.buffer).digest("hex");
                this.hashes.set(hash, name);
            }
        }
    }

    public async lookup(profile: Profile): Promise<Omit<CapeInfo, "service">> {
        if (!profile.capeUrl) {
            throw new Error("No cape");
        }

        const urlId = profile.capeUrl.split("/").pop()!;

        let capeName = this.urls.get(urlId);

        const response = await getAxiosInstance().get(profile.capeUrl, {
            responseType: "arraybuffer"
        });
        if (response.status !== 200) {
            throw new Error("Failed to fetch cape");
        }
        const info = await this.formatCape(response.data);

        if (!capeName) {
            const hash = Crypto.createHash("sha256").update(info.buffer).digest("hex");
            capeName = this.hashes.get(hash);
            if (capeName) {
                this.urls.set(urlId, capeName);
            }
        }

        if (!capeName) {
            console.error("Unknown official cape!");
            console.error(`data:image/png;base64,${Buffer.from(info.buffer).toString("base64")}`);
        }

        return {
            image: info.buffer,
            hasElytra: info.hasElyta,
            name: capeName || null,
            description: null,
            frames: info.frames,
            ticksPerFrame: 1,
            dateUploaded: null,
            websiteUrl: null,
            assetUrl: null,
            creator: null,
            dataFreshness: new Date()
        }
    }
}