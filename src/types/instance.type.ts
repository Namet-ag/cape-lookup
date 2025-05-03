export interface Instance {
    id: string;
    cron: string | null;
    token: string;
    concurrentLookups: number;
}