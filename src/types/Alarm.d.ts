export type Alarm = TimeAlarm | DateAlarm;

export interface AlarmMeta {
    message: string;
    channelId: string;
    serverId: string;
    id: string;
}

export type TimeAlarm = {
    type: 'time';
    lastSent: number;
    hours: number;
    minutes: number;
} & AlarmMeta;

export type DateAlarm = {
    type: 'date';
    date: number;
    sent: boolean;
} & AlarmMeta;

export interface AlarmDateOptions {
    date: string;
    message: string;
}