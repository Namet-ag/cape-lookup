import { CronJob } from "cron";
import { LookerManager } from "./looker-manager";
import { Queue } from "./queue";
import { Socket } from "./socket";
import { CONCURRENT_LOOKUPS, CRON, NODE_ID, TOKEN, WS_URL } from "./variables";

const lookerManager = new LookerManager();
lookerManager.onready = () => {
    console.log("Looker Manager is ready");

    const queue = new Queue();
    const socket = new Socket(WS_URL, TOKEN, NODE_ID, queue);
    socket.on("error", (error) => {
        console.error("Core error:", error);
    });

    socket.on("lookup-queue/distribute", (data) => {
        queue.addToQueue(data.entries);
    });
    
    function lookup() {
        const threadSpace = CONCURRENT_LOOKUPS - lookerManager.getActiveThreads();
        console.log("Current thread space:", threadSpace);
        const newEntries = queue.take(threadSpace);
        for (let entry of newEntries) {
            lookerManager.lookup(entry.user, async (capes) => {
                const data = {
                    id: entry.id,
                    queueSize: queue.getQueueLength(),
                    services: capes.map((cape, index) => ({
                        ...cape,
                        image: undefined,
                        bufferId: index
                    }))
                };

                const buffers = capes.map((cape) => cape.image);
                socket.send("submit", data, buffers);
                const start = Date.now();
                const timeout = setTimeout(() => {
                    console.log("SUBMISSION TOOK OVER 1s");
                }, 1000);
                try {
                    await socket.waitForSubmissionSuccess(entry);
                    console.log(`Submission took ${Date.now() - start}ms`);
                } catch (e) {
                    console.error(e);
                }
                clearTimeout(timeout);
            }).then(() => {
                setTimeout(() => lookup());
            }).catch((error) => {
                console.error("Looker error", error);
            })
        }
    }

    queue.on("added", () => {
        lookup();
    });

    if (CRON) {
        console.log("Cron jobs enabled.");
        let isCronActive = false;

        CronJob.from({
            cronTime: CRON,
            onTick: () => {
                if (isCronActive) {
                    console.log("Cron jobs already running.");
                    return;
                }
                isCronActive = true;
                console.log("Staring cron jobs...");
                lookerManager.cron(async (cape) => {
                    const data = {
                        ...cape,
                        image: undefined,
                        bufferId: 0
                    };
                    socket.send("cape", data, [cape.image]);
                }).finally(() => {
                    isCronActive = false;
                    console.log("Cron jobs finished.");
                })
            },
            start: true,
        });
    } else {
        console.log("Cron jobs not enabled.");
    }
}