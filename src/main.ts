import Config from "./config";
import * as ChildProcess from "child_process";

for (let instance of Config.instances) {
    const child = ChildProcess.spawn("npx", ["tsx", "src/instance"], {
        env: {
            WS_URL: Config.wsUrl,
            ID: instance.id,
            CRON: instance.cron || "",
            TOKEN: instance.token,
            CONCURRENT_LOOKUPS: instance.concurrentLookups.toString()
        }
    });

    child.stdout.on("data", (chunk: Buffer) => {
        for (let line of chunk.toString().split("\n")) {
            if (line.trim()) {
                process.stdout.write(`[${instance.id}]: ${line}\n`);
            }
        }
    });

    child.stderr.on("data", (chunk: Buffer) => {
        for (let line of chunk.toString().split("\n")) {
            if (line.trim()) {
                process.stderr.write(`[${instance.id}]: ${line}\n`);
            }
        }
    });

    child.on("error", (error) => {
        console.error(error);
    });
}