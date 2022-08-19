import { Command } from './Command';
import { Client, Message } from 'discord.js';
import { getErrorEmbed } from '../utils/EmbedUtil';
import {
    COOLDOWN_TYPE,
    getCooldownRemainingMillis,
    isInCooldown,
    setCooldown
} from '../utils/CooldownUtil';

/**
 * Used to react to a message with a melon
 */

const COOLDOWN = 1000 * 30;

export class Melo extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (evt.member) {
            // Andy
            if (evt.member.id === '116972453841862662') return;
            const inCooldown = isInCooldown(COOLDOWN_TYPE.MELO, evt.member);
            if (!inCooldown) {
                await evt.react('🍈');
                setCooldown(
                    COOLDOWN_TYPE.MELO,
                    evt.member,
                    Date.now() + COOLDOWN
                );
            } else {
                const cooldown = getCooldownRemainingMillis(
                    COOLDOWN_TYPE.MELO,
                    evt.member
                );
                if (cooldown) {
                    const seconds = Math.ceil(cooldown / 1000);
                    evt.channel.send(
                        getErrorEmbed(
                            `You melo'd. Try again in about ${seconds} seconds`
                        )
                    );
                }
            }
        }
    }

    getCommand(): string[] {
        return ['melo'];
    }
}
