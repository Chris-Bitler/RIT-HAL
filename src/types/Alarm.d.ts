export interface Alarm {
    lastSent: number;
    hours: number;
    minutes: number;
    message: string;
    channelId: string;
    serverId: string;
    id: string;
}