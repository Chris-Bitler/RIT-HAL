import { Command } from "./Command";
import {Client, Message, MessageEmbed} from "discord.js";
import { getErrorEmbed } from "../utils/EmbedUtil";
import {COOLDOWN_TYPE, getCooldownRemainingMillis, isInCooldown, setCooldown} from "../utils/CooldownUtil";

/**
 * Used to give someone a present!
 */

const COOLDOWN = 1000*60*10;
const IMAGES = [
    "https://cdn.discordapp.com/attachments/535311735083761705/784621745909792796/article-0-0F22E4F300000578-182_634x440.png",
    "https://cdn.discordapp.com/attachments/535311735083761705/784621760292978718/tiger-cubs-get-christmas-presents-c-zsl-london.png",
    "https://cdn.discordapp.com/attachments/535311735083761705/784621816856838164/taronga-tiger-cubs.png",
    "https://cdn.discordapp.com/attachments/535311735083761705/784621940501118986/xmas8_t1160.png",
    "https://cdn.discordapp.com/attachments/535311735083761705/784621967902507069/Tiger2Bgets2Bin2Ba2Btangle2Bwith2Bher2Bearly2BChristmas2Bpresent2B3.png",
    "https://cdn.discordapp.com/attachments/535311735083761705/784622011879784518/eggmhud3w3631.png",
    "https://cdn.discordapp.com/attachments/535311735083761705/784622331796127754/61bd4c3d64ba113e5bfe3a33517ad097.png"
];

export class Present extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (evt.member) {
            const inCooldown = isInCooldown(COOLDOWN_TYPE.PRESENT, evt.member);
            if (!inCooldown) {
                const mentioned = evt.mentions.members?.first();
                if (mentioned) {
                    const image = IMAGES[Math.floor(Math.random()*IMAGES.length)];
                    const emoji = evt.guild?.emojis.resolve("642150570429382656") || null;
                    const embed = new MessageEmbed();
                    embed.setTitle("Presents!");
                    embed.setDescription(`${evt.member} has gifted ${mentioned} a present! :gift: ${emoji || ""}`);
                    embed.setImage(image);
                    await evt.channel.send(embed);
                    setCooldown(COOLDOWN_TYPE.PRESENT, evt.member, Date.now() + COOLDOWN);
                } else {
                    evt.channel.send(getErrorEmbed("You need to specify someone to give a present to."));
                }
            } else {
                const cooldown = getCooldownRemainingMillis(COOLDOWN_TYPE.PRESENT, evt.member);
                if (cooldown) {
                    const minutes = Math.ceil(cooldown / 60000);
                    evt.channel.send(getErrorEmbed(`You gave a gift recently. Try again in about ${minutes} minutes`));
                }
            }
        }
    }

    getCommand(): string[] {
        return ["present"];
    }
}
