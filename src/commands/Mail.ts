import { Command } from './Command';
import { Client, Message } from 'discord.js';
import { getErrorEmbed, getInformationalEmbed } from '../utils/EmbedUtil';
import { mergeArgs } from '../utils/StringUtil';
import {
    MESSAGE_SENT,
    NO_SERVER,
    sendMessageToChannel
} from '../processors/MailProcessor';

export class Mail extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (args.length > 1) {
            const serverName = args[0];
            const message = mergeArgs(1, args);
            const result = await sendMessageToChannel(
                client,
                serverName,
                evt.author.username,
                message
            );
            switch (result) {
                case MESSAGE_SENT:
                    evt.channel.send(
                        getInformationalEmbed(
                            'Message sent',
                            `Your message was sent to the staff in the ${serverName} discord`
                        )
                    );
                    break;
                case NO_SERVER:
                    evt.channel.send(
                        getErrorEmbed('No server with that name was found')
                    );
                    break;
            }
        } else {
            evt.channel.send(
                getErrorEmbed('Please specify a server and message to send')
            );
        }
    }

    getCommand(): string[] {
        return ['mail'];
    }

    commandType(): string {
        return 'dm';
    }
}
