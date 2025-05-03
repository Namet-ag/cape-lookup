import { Instance } from "./instance.type";

export interface Config {
    wsUrl: string;
    instances: Instance[];
}