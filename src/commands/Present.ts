import { Command } from './Command';
import { Client, Message, MessageEmbed } from 'discord.js';
import { getErrorEmbed } from '../utils/EmbedUtil';
import {
    COOLDOWN_TYPE,
    getCooldownRemainingMillis,
    isInCooldown,
    setCooldown
} from '../utils/CooldownUtil';

/**
 * Used to give someone a present!
 */

const COOLDOWN = 1000 * 60 * 10;
const IMAGES = [
    'https://cdn.discordapp.com/attachments/535311735083761705/784621745909792796/article-0-0F22E4F300000578-182_634x440.png',
    'https://cdn.discordapp.com/attachments/535311735083761705/784621760292978718/tiger-cubs-get-christmas-presents-c-zsl-london.png',
    'https://cdn.discordapp.com/attachments/535311735083761705/784621816856838164/taronga-tiger-cubs.png',
    'https://cdn.discordapp.com/attachments/535311735083761705/784621940501118986/xmas8_t1160.png',
    'https://cdn.discordapp.com/attachments/535311735083761705/784621967902507069/Tiger2Bgets2Bin2Ba2Btangle2Bwith2Bher2Bearly2BChristmas2Bpresent2B3.png',
    'https://cdn.discordapp.com/attachments/535311735083761705/784622011879784518/eggmhud3w3631.png',
    'https://cdn.discordapp.com/attachments/535311735083761705/784622331796127754/61bd4c3d64ba113e5bfe3a33517ad097.png',
    'https://cdn.discordapp.com/attachments/687444272458629194/785366739210207232/121217_tiger_presents_web.png',
    'https://cdn.discordapp.com/attachments/687444272458629194/785367478859071498/bb4ff8de-03e0-44c5-8935-e72884fefe7d.png',
    'https://cdn.discordapp.com/attachments/687444272458629194/785367594122870804/maxresdefault.png',
    'https://cdn.discordapp.com/attachments/778482708212088853/785721567421792286/image.png',
    'https://cdn.discordapp.com/attachments/778482708212088853/785721665409384478/f4fc57911b4f490c0d358d4852a9a2a5.png',
    'https://cdn.discordapp.com/attachments/778482708212088853/785721685617147904/vli8j-white-tiger-plays-in-box-lg.png',
    'https://cdn.discordapp.com/attachments/778482708212088853/785721709625344010/QE7nITJ.png',
    'https://cdn.discordapp.com/attachments/778482708212088853/785721789387898920/Puss2Bin2Bbox25212BTiger2Bgets2Bin2Ba2Btangle2Bwith2Bher2Bearly2BChristmas2Bpresent2B2B2B4.png',
    'https://cdn.discordapp.com/attachments/778482708212088853/785721810943213598/IgCOGWL.png',
    'https://cdn.discordapp.com/attachments/778482708212088853/785721836519424000/maxresdefault.png',
    'https://cdn.discordapp.com/attachments/778482708212088853/785721865796452362/maxresdefault.png'
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
                    const image =
                        IMAGES[Math.floor(Math.random() * IMAGES.length)];
                    const emoji =
                        evt.guild?.emojis.resolve('642150570429382656') || null;
                    const embed = new MessageEmbed();
                    embed.setTitle('Presents!');
                    embed.setDescription(
                        `${
                            evt.member
                        } has gifted ${mentioned} a present! :gift: ${
                            emoji || ''
                        }`
                    );
                    embed.setImage(image);
                    await evt.channel.send(embed);
                    setCooldown(
                        COOLDOWN_TYPE.PRESENT,
                        evt.member,
                        Date.now() + COOLDOWN
                    );
                } else {
                    evt.channel.send(
                        getErrorEmbed(
                            'You need to specify someone to give a present to.'
                        )
                    );
                }
            } else {
                const cooldown = getCooldownRemainingMillis(
                    COOLDOWN_TYPE.PRESENT,
                    evt.member
                );
                if (cooldown) {
                    const minutes = Math.ceil(cooldown / 60000);
                    evt.channel.send(
                        getErrorEmbed(
                            `You gave a gift recently. Try again in about ${minutes} minutes`
                        )
                    );
                }
            }
        }
    }

    getCommand(): string[] {
        return ['present'];
    }
}
