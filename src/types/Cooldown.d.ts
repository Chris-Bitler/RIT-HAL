export interface Cooldown {
    [memberId: string]: number;
}

export interface CooldownContainer {
    [key: string]: Cooldown;
}
