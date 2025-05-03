import { Looker } from "./looker";
import * as FS from "fs";
import { Profile } from "./types/profile.type";
import { CapeInfo } from "./types/cape-info.type";

export class LookerManager {
    private readonly lookers: Looker[] = [];
    public onready: (() => void) | null = null;
    private activeThreads = 0;

    constructor() {
        FS.readdir(__dirname + "/looker", async (error, files) => {
            if (error) {
                console.error("Failed to read looker directory.", error);
                process.exit(1);
            }

            for (let file of files) {
                if (!file.startsWith("-")) {
                    try {
                        const instance: Looker = new (await import(`./looker/${file}`)).default;
                        if (!instance.id) {
                            console.error(`Looker ${file} does not have an ID.`);
                            process.exit(1);
                        }
    
                        this.lookers.push(instance);
                        console.log(`Loaded looker ${instance.id}.`);
                        await new Promise<void>(resolve => {
                            instance.onready = resolve;
                        });
                    } catch (e) {
                        console.error(`Failed to load looker ${file}.`);
                        console.error(e);
                        process.exit(1);
                    }
                }
            }
            console.log("Looker manager ready.");
            this.onready?.();
        });
    }

    public async lookup(profile: Profile, callback?: (capes: CapeInfo[]) => (void | Promise<void>)) {
        this.activeThreads++;

        const promises = this.lookers.map(looker => new Promise<CapeInfo>((resolve, reject) => {
            looker.lookup(profile).then(resolution => {
                if (looker.isDebug()) {
                    console.log(`Looked up ${profile.uuid} with looker ${looker.id} successfully.`);
                }
                resolve({
                    ...resolution,
                    service: looker.id
                })
            }).catch(error => {
                if (looker.isDebug()) {
                    console.error(`Failed to look up ${profile.uuid} with looker ${looker.id}.`);
                    console.error(error);
                }
                reject(error);
            });
        }));

        const responses = await Promise.allSettled(promises);
        // console.log(`Finished lookup for ${entry.id} in ${Date.now() - start}ms.`);

        const capes = responses.filter(r => r.status == "fulfilled").map((r) => (r as PromiseFulfilledResult<CapeInfo>).value);

        if (callback) {
            await callback(capes);
        }

        this.activeThreads--;
        // console.log(`Finished lookup and submission for ${entry.id} in ${Date.now() - start}ms.`);
    }

    public getActiveThreads() {
        return this.activeThreads;
    }

    public getLookers() {
        return [...this.lookers];
    }

    public async cron(onCape: (info: CapeInfo) => Promise<void>) {
        for (let looker of this.lookers) {
            try {
                await looker.cron((cape) => onCape({
                    service: looker.id,
                    ...cape
                }));
            } catch (e) {
                console.error(e);
            }
        }
    }
}