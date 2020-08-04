import {GuildMember} from "discord.js";

export interface CommandArgsTime {
    target: GuildMember|null
    time: number|null
    reason: string|null
}

export interface CommandArgs {
    target: GuildMember|null,
    reason: string|null
}