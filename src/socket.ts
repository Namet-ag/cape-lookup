import * as WS from "ws";
import { Packet, PacketType, SubmitSuccessPacket } from "./types/packet.type";
import EventEmitter from "events";
import { Queue } from "./queue";
import { LookupEntry } from "./types/lookup-entry.type";

export class Socket {
    private connection: WS.WebSocket;
    private reconnectDelay = 0;
    private reconnectKey: {} = {};
    private emitter = new EventEmitter();

    constructor(
        private readonly url: string,
        private readonly token: string,
        private readonly nodeId: string,
        private readonly queue: Queue
    ) {
        this.connect();
    }

    private connect() {
        if (this.connection) {
            this.connection.close();
            this.connection.removeAllListeners();
        }

        const reconnect = () => {
            const delay = this.reconnectDelay;
            this.reconnectDelay = Math.min(30, Math.max(0.5, this.reconnectDelay) * 2);
            const key = {};
            this.reconnectKey = key;
            console.log(`Re-attempting connection to Core in ${delay}s`);
            setTimeout(() => {
                if (this.reconnectKey == key) {
                    this.connect();
                }
            }, delay * 1000);
        }

        const start = Date.now();
        console.log("Attempting to connect to Core...");
        this.connection = new WS.WebSocket(this.url, {
            headers: {
                authorization: `Bearer ${this.token}`
            }
        });

        this.connection.on("open", () => {
            this.reconnectDelay = 0;
            console.log(`Connection to Core established (${Date.now() - start}ms)`);
            this.send("init", {
                nodeId: this.nodeId,
                queueSize: this.queue.getQueueLength()
            });
        });

        this.connection.on("close", (code, reason) => {
            this.queue.clear();
            const reasonString = reason.toString();
            let message = `Connection to Core closed (${code})`;
            if (reasonString) {
                message += `: "${reasonString}"`;
            }
            console.log(message);
            reconnect();
        });

        this.connection.on("error", (error) => {
            if (error.message.startsWith("connect ECONNREFUSED")) {
                console.error(`Core connection error: Core is offline?`);
            } else {
                console.error(`Core connection error:`, error);
            }
        });

        this.connection.on("message", (buffer) => {
            try {
                const json: Packet<any> = JSON.parse(buffer.toString());

                if (typeof json.event != "string" || typeof json.data != "object") {
                    throw new Error("Invalid packet");
                }

                this.emit(json.event as keyof PacketType, json.data);
            } catch (e) {
                console.error(e);
            }
        });
    }

    public send(event: string, data: Object, buffers?: Buffer[]) {
        if (this.connection.readyState != this.connection.OPEN) {
            console.log(`Connection to Core not established, event "${event}" not sent`);
            return;
        }

        if (!buffers) {
            return this.connection.send(JSON.stringify({
                event: `lookup-queue/${event}`,
                data
            }));
        }

        const bufferSizes = buffers.map((buffer) => buffer.length);

        const jsonBuffer = Buffer.from(JSON.stringify({
            event: `lookup-queue/${event}`,
            bufferSizes,
            data
        }), "utf-8");

        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32BE(jsonBuffer.length, 0);

        const fullMessage = Buffer.concat([lengthBuffer, jsonBuffer, ...buffers]);
        this.connection.send(fullMessage);
    }

    protected emit<T extends keyof PacketType>(event: T, data: PacketType[T]) {
        if (this.emitter.listeners(event).length) {
            this.emitter.emit(event, data);
        } else {
            console.log(`Received event "${event}" from Core but it doesn't have any listeners`);
        }
    }

    public on<T extends keyof PacketType>(event: T, callback: (data: PacketType[T]) => void) {
        this.emitter.on(event, callback);
    }

    public off<T extends keyof PacketType>(event: T, callback: (data: PacketType[T]) => void) {
        this.emitter.off(event, callback);
    }

    public waitForSubmissionSuccess(entry: LookupEntry) {
        return new Promise<void>((resolve, reject) => {

            const callback = (data: SubmitSuccessPacket) => {
                if (data.id == entry.id) {
                    end();
                    resolve();
                }
            }

            const closeCallback = () => {
                end();
                reject(new Error("Connection closed"));
            };

            this.connection.on("close", closeCallback);

            this.on("lookup-queue/submit-success", callback);

            const end = () => {
                this.connection.off("close", closeCallback);
                this.off("lookup-queue/submit-success", callback);
            }
        });
    }
}