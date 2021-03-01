import { CooldownContainer } from '../types/Cooldown';
import { GuildMember } from 'discord.js';

const cooldowns: CooldownContainer = {};

export enum COOLDOWN_TYPE {
    SNOWBALL,
    PRESENT,
    MELO
}

/**
 * Initiate the cooldowns
 */
export const initCooldowns = (): void => {
    Object.getOwnPropertyNames(COOLDOWN_TYPE).forEach((type) => {
        cooldowns[type] = {};
    });
};

/**
 * Get whether the member is in a cooldown
 * @param type - The cooldown type
 * @param member - The member
 */
export const isInCooldown = (
    type: COOLDOWN_TYPE,
    member: GuildMember
): boolean => {
    const cooldownsOfType = cooldowns[type];
    if (cooldownsOfType && cooldownsOfType[member.id]) {
        const cooldownTime = cooldownsOfType[member.id];
        return cooldownTime > Date.now();
    }

    return false;
};

export const setCooldown = (
    type: COOLDOWN_TYPE,
    member: GuildMember,
    time: number
): void => {
    const cooldownOfType = cooldowns[type];
    if (cooldownOfType) {
        cooldownOfType[member.id] = time;
    }
};

export const getCooldownRemainingMillis = (
    type: COOLDOWN_TYPE,
    member: GuildMember
): number | null => {
    const cooldownOfType = cooldowns[type];
    if (cooldownOfType) {
        const cooldown = cooldownOfType[member.id];
        if (cooldown) {
            return cooldown - Date.now();
        }
    }

    return null;
};
