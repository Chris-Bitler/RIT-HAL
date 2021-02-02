import { GuildMember } from "discord.js";
import {PunishmentType} from "../processors/ModProcessor";

export interface CommandArgsTime {
    target: GuildMember | null;
    time: number | null;
    reason: string | null;
}

export interface CommandArgs {
    target: GuildMember | null;
    reason: string | null;
}

export interface ListArgs {
    type?: PunishmentType;
    name: string;
}