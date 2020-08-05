import { MessageEmbed } from "discord.js";

export function getErrorEmbed(text: string): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle("Error");
  embed.setColor("RED");
  embed.setDescription(text);
  embed.setTimestamp(Date.now());
  return embed;
}

export function getInformationalEmbed(
  title: string,
  text: string
): MessageEmbed {
  const embed = new MessageEmbed();
  embed.setTitle(title);
  embed.setColor("BLUE");
  embed.setDescription(text);
  embed.setTimestamp(Date.now());
  return embed;
}
