export interface Mute {
    memberId: string;
    muterId: string;
    serverId: string;
    reason: string;
    expiration: number;
}

export interface Ban {
    memberId: string;
    bannerId: string;
    serverId: string;
    reason: string;
    expiration: number;
}
