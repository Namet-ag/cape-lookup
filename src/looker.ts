import Sharp from "sharp";
import { blankSharp } from "./utils";
import { Profile } from "./types/profile.type";
import { CapeInfo } from "./types/cape-info.type";

export abstract class Looker {
    protected debug = false;
    public onready: (() => void) | null = null;

    constructor(public readonly id: string) {
        setTimeout(() => this.prepare().then(() => {
            console.log(`Looker ${this.id} ready.`);
            this.onready?.();
        }).catch(e => {
            console.error(`Failed to prepare looker ${this.id}.`);
            console.error(e);
        }));
    }

    public isDebug() {
        return this.debug;
    }

    protected async prepare(): Promise<void> {}

    public async cron(onCape: (info: Omit<CapeInfo, "service">) => Promise<void>): Promise<void> {}

    public abstract lookup(profile: Profile): Promise<Omit<CapeInfo, "service">>;

    protected async formatCape(buffer: Buffer, getFrameCount?: (width: number, height: number) => number): Promise<{
        buffer: Buffer,
        hasElyta: boolean,
        frames: number
    }> {
        const sharp = Sharp(buffer);
        const meta = await sharp.metadata();

        if (!meta.width || !meta.height) {
            throw new Error("Invalid image dimensions.");
        }

        const frames = getFrameCount?.(meta.width, meta.height) || 1;
        const aspectRatio = meta.width / meta.height * frames;

        if (aspectRatio == 46 / 22) {
            const targetWidth = meta.width / 46 * 64;
            const blank = blankSharp(targetWidth, targetWidth / 2, true);
            blank.composite([{
                input: buffer,
                top: 0,
                left: 0
            }]);
            const newBuffer = await blank.png().toBuffer();
            blank.destroy();
            sharp.destroy();
            return {
                buffer: newBuffer,
                hasElyta: true, // todo: detect elytra
                frames
            };
        }

        if (aspectRatio == 22 / 17) {
            const targetWidth = meta.width / 22 * 64;
            const blank = blankSharp(targetWidth, targetWidth / 2, true);
            blank.composite([{
                input: buffer,
                top: 0,
                left: 0
            }]);
            const newBuffer = await blank.png().toBuffer();
            blank.destroy();
            sharp.destroy();
            return {
                buffer: newBuffer,
                hasElyta: false,
                frames
            };
        }

        if (aspectRatio == 64 / 32) {
            const newBuffer = await sharp.png().toBuffer();
            sharp.destroy();
            return {
                buffer: newBuffer,
                hasElyta: true, // todo: detect elytra
                frames
            };
        }

        throw new Error("Invalid cape format.");
    }
}