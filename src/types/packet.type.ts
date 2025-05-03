import { LookupEntry } from "./lookup-entry.type";

export type ErrorPacket = {
    httpStatusCode: number;
    message: string | string[];
    timestamp: string;
}

export type DistributePacket = {
    entries: LookupEntry[];
}

export type SubmitSuccessPacket = {
    id: string;
}

export type PacketType = {
    "error": ErrorPacket;
    "lookup-queue/distribute": DistributePacket;
    "lookup-queue/submit-success": SubmitSuccessPacket;
};

export type Packet<T extends keyof PacketType> = {
    event: T;
    data: PacketType[T]
};