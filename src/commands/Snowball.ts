import { Command } from "./Command";
import {Client, Message, MessageEmbed} from "discord.js";
import { getErrorEmbed } from "../utils/EmbedUtil";
import {COOLDOWN_TYPE, getCooldownRemainingMillis, isInCooldown, setCooldown} from "../utils/CooldownUtil";

/**
 * Used to throw a snowball at someone!
 */

const COOLDOWN = 1000*60*10;

export class Snowball extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (evt.member) {
            const inCooldown = isInCooldown(COOLDOWN_TYPE.SNOWBALL, evt.member);
            if (!inCooldown) {
                const mentioned = evt.mentions.members?.first();
                if (mentioned) {
                    const embed = new MessageEmbed();
                    embed.setTitle("Snowball Fight!");
                    embed.setDescription(`${evt.member} has thrown a snowball at ${mentioned}! :snowflake: :white_circle:`);
                    await evt.channel.send(embed);
                    setCooldown(COOLDOWN_TYPE.SNOWBALL, evt.member, Date.now() + COOLDOWN);
                } else {
                    evt.channel.send(getErrorEmbed("You need to specify someone to throw a snowball at."));
                }
            } else {
                const cooldown = getCooldownRemainingMillis(COOLDOWN_TYPE.SNOWBALL, evt.member);
                if (cooldown) {
                    const minutes = Math.ceil(cooldown / 60000);
                    evt.channel.send(getErrorEmbed(`You threw a snowball recently. Try again in about ${minutes} minutes`));
                }
            }
        }
    }

    getCommand(): string[] {
        return ["snowball"];
    }
}
