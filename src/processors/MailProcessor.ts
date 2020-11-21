import {Client, MessageEmbed, TextChannel} from "discord.js";
import {MailConfig} from "../models/MailConfig";

export const NAME_TAKEN_ERR = "NAME_TAKEN_ERR";
export const CONFIG_SET = "CONFIG_SET";
export const MESSAGE_SENT = "MESSAGE_SENT";
export const NO_SERVER = "NO_SERVER";

export const sendMessageToChannel = async (
    client: Client,
    serverName: string,
    sender: string,
    message: string
): Promise<string> => {
    const mailConfig = await getMailConfig(serverName);
    if (mailConfig) {
        const channel = client.guilds.resolve(mailConfig.serverId)?.channels?.resolve(mailConfig.adminChannelId);
        if (channel?.type === "text") {
            const textChannel = channel as TextChannel;
            await textChannel.send(makeEmbed(sender, message));
            return MESSAGE_SENT;
        }
    }
    return NO_SERVER;
}

export const makeEmbed = (sender: string, message: string): MessageEmbed => {
    const embed = new MessageEmbed();
    return embed.setTitle("Admin mail")
        .setDescription(message)
        .setFooter(`From: ${sender}`)
        .setTimestamp(Date.now())
}

export const setMailConfig = async (serverId: string, serverName: string, channelId: string): Promise<string> => {
    const serverNameUsed = await MailConfig.findOne({
        where: {
            serverName
        }
    });
    if(!serverNameUsed) {
        const [result, created] = await MailConfig.findOrCreate({
            where: {
                serverId
            }, defaults: {
                serverId,
                serverName,
                adminChannelId: channelId
            }
        });

        if (!created) {
            await result.update({
                serverId,
                serverName,
                adminChannelId: channelId
            });
        }

        return CONFIG_SET;
    } else {
        return NAME_TAKEN_ERR;
    }
}

export const getMailConfig = async (serverName: string): Promise<MailConfig|null> => {
    return MailConfig.findOne({
        where: {
            serverName
        }
    });
}