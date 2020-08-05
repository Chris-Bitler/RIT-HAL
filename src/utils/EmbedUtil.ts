import {MessageEmbed} from "discord.js";

export function getErrorEmbed(text: string): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle("Error");
    embed.setColor("red");
    embed.setDescription(text);
    embed.setTimestamp(Date.now());
    return embed;
}

export function getInformationalEmbed(title: string, text: string): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle(title);
    embed.setColor("blue");
    embed.setDescription(text);
    embed.setTimestamp(Date.now());
    return embed;
}