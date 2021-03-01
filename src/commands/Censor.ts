import { Command } from './Command';
import { Channel, Client, Message, Permissions, TextChannel } from 'discord.js';
import { CensorProcessor } from '../processors/CensorProcessor';
import { mergeArgs } from '../utils/StringUtil';

/**
 * Used to show a larger version of an emoji in the channel
 */
export class Censor extends Command {
    processor: CensorProcessor = CensorProcessor.getInstance();

    /**
     * Process the Censor command
     * @param client The discord client
     * @param evt The message event
     * @param args The args for the command
     */
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (!(evt.channel instanceof TextChannel)) {
            return;
        }
        const channel = evt.channel as TextChannel;
        if (!args.length) {
            await this.sendCensorHelp(channel);
            return;
        }

        const type = args[0].toLowerCase();
        switch (type) {
            case 'list':
                await this.handleCensorList(channel, args);
                break;
            case 'add':
                await this.handleCensorAdd(evt, args);
                break;
            case 'remove':
                await this.handleCensorRemove(evt, args);
                break;
            default:
                await this.sendCensorHelp(evt.channel);
        }
    }

    /**
     * Send help text for the censor command
     * @param channel The channel to send the message in
     */
    async sendCensorHelp(channel: Channel) {
        if (channel instanceof TextChannel) {
            await channel.send(
                'To use the censor command, try one of the following things\n' +
                    '`-censor list (query)` - the query is optional\n' +
                    '`-censor add [word]` - Use % to act as a wildcard\n' +
                    '`-censor remove [word]` - Must match word exactly'
            );
        }
    }

    /**
     * Handle the user using the -censor list command
     * @param channel The channel the message was sent in
     * @param args The command arguments
     */
    async handleCensorList(channel: TextChannel, args: string[]) {
        let query = undefined;
        if (args.length >= 2) {
            query = mergeArgs(1, args);
        }

        const matchingResults = this.processor.queryCensoredWords(
            channel.guild.id,
            query
        );
        await channel.send(
            `Currently censored words ${query ? `matching ${query}` : ''}`
        );

        for (const result of matchingResults) {
            await channel.send(result);
        }
    }

    /**
     * Handle the user using the -censor add command
     * @param evt The discord message
     * @param args The command arguments
     */
    async handleCensorAdd(evt: Message, args: string[]) {
        if (args.length < 2) {
            await evt.channel.send(
                'Correct usage of `-censor add`: `-censor add [word]`'
            );
            return;
        }

        const word = mergeArgs(1, args);
        const guild = evt.guild;
        if (guild) {
            const success = await this.processor.addCensoredWord(
                guild.id,
                word
            );
            if (success) {
                await evt.channel.send(
                    `${word} added to list of censored words`
                );
            } else {
                await evt.channel.send(
                    `An error occurred trying to add ${word} to the censored word list`
                );
            }
        }
    }

    /**
     * Handle the user using the -censor remove command
     * @param evt The discord message
     * @param args The command arguments
     */
    async handleCensorRemove(evt: Message, args: string[]) {
        if (args.length < 2) {
            await evt.channel.send(
                'Correct usage of `-censor remove`: `-censor remove [word]`'
            );
            return;
        }

        const word = mergeArgs(1, args);
        const guild = evt.guild;
        if (guild) {
            const success = await this.processor.removeCensoredWord(
                guild.id,
                word
            );
            if (success) {
                await evt.channel.send(
                    `${word} was removed from the list of censored words`
                );
            } else {
                await evt.channel.send(
                    `Unable to remove ${word} from the list of censored words - is it there?`
                );
            }
        }
    }

    getCommand(): string[] {
        return ['censor'];
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.ADMINISTRATOR;
    }

    allowEmptyArgs(): boolean {
        return true;
    }
}
