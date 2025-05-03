import * as FS from "fs";
import { Config } from "./types/config.type";

const DEFAULT_CONFIG: Config = {
    wsUrl: "ws://127.0.0.1:3010",
    instances: [{
        id: "lookup-1",
        cron: "0 0 * * *",
        token: "TOKEN",
        concurrentLookups: 10
    }]
};

if (!FS.existsSync("./Config.json")) {
    FS.writeFileSync("./Config.json", JSON.stringify(DEFAULT_CONFIG, null, 2));
    console.log("Created Config.json");
    process.exit(0);
}

const config: Config = JSON.parse(FS.readFileSync("./Config.json", "utf-8"));
if (typeof config.wsUrl != "string") {
    throw new Error("wsUrl is not string");
}
if (!Array.isArray(config.instances)) {
    throw new Error("instances is not array");
}
for (let instance of config.instances) {
    if (typeof instance.id != "string") {
        throw new Error("instance.id is not string");
    }
    if (instance.cron !== null && typeof instance.cron != "string") {
        throw new Error("instance.cron is not string or null");
    }
    if (typeof instance.concurrentLookups != "number" || Math.round(instance.concurrentLookups) != instance.concurrentLookups) {
        throw new Error("instance.concurrentLookups is not int");
    }
    if (typeof instance.token != "string") {
        throw new Error("instance.token is not string");
    }
}

export default config;