import { Command } from './Command';
import { Client, Message, Permissions } from 'discord.js';
import {
    CONFIG_SET,
    NAME_TAKEN_ERR,
    setMailConfig
} from '../processors/MailProcessor';
import { getErrorEmbed, getInformationalEmbed } from '../utils/EmbedUtil';

export class MailConfig extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        const serverName = args?.[0];
        const channel = args[1]?.replace(/[<>#]+/g, '');
        const serverId = evt.guild?.id;
        if (serverName && channel && serverId) {
            const result = await setMailConfig(serverId, serverName, channel);
            if (result === CONFIG_SET) {
                await evt.channel.send(
                    getInformationalEmbed(
                        'Mail config updated',
                        `Server admin mail configuration updated`
                    )
                );
            } else if (result === NAME_TAKEN_ERR) {
                await evt.channel.send(
                    getErrorEmbed(
                        'That server name is already taken. Try a different one'
                    )
                );
            }
        } else {
            await evt.channel.send(
                getErrorEmbed(
                    'Incorrect syntax. Try -mailconfig [serverName] [admin channel]'
                )
            );
        }
    }

    getConfigBase(): string {
        return 'mailconfig';
    }

    getCommand(): string[] {
        return ['mconfig'];
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.ADMINISTRATOR;
    }
}
