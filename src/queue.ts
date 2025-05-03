import EventEmitter from "events";
import { LookupEntry } from "./types/lookup-entry.type";

type EventId = "added";

export class Queue {
    private readonly queue: LookupEntry[] = [];
    private readonly emitter = new EventEmitter();

    getQueueLength() {
        return this.queue.length;
    }

    addToQueue(entries: LookupEntry[]) {
        if (!entries.length) {
            return;
        }
        entries = entries.filter((entry) => !this.queue.some((existingEntry) => existingEntry.id == entry.id));
        this.queue.push(...entries);
        console.log(`Added ${entries.length} entries to queue`);
        this.emit("added");
    }

    take(amount: number) {
        return this.queue.splice(0, amount);
    }

    on(event: EventId, callback: () => void) {
        this.emitter.on(event, callback);
    }

    off(event: EventId, callback: () => void) {
        this.emitter.on(event, callback);
    }

    private emit(event: EventId) {
        this.emitter.emit(event);
    }
}