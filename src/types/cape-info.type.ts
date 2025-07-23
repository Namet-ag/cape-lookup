export type CapeInfo = {
    service: string;
    image: Buffer;
    hasElytra: boolean;
    name: string | null;
    description: string | null;
    frames: number;
    ticksPerFrame: number;
    dateUploaded: Date | null;
    websiteUrl: string | null;
    assetUrl: string | null;
    creator: string | null;
    dataFreshness?: Date;
}