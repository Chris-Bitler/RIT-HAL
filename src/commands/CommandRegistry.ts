import { Client, Message, TextChannel } from 'discord.js';
import { Command } from './Command';
import { Big } from './Big';
import { Bus } from './Bus';
import { EmojiTop } from './EmojiTop';
import { Courses } from './Courses';
import { removeEmptyArgs } from '../utils/StringUtil';
import { Food } from './Food';
import { FoodSpecials } from './FoodSpecials';
import { EmojiRole } from './EmojiRole';
import { Pin } from './Pin';
import { Config } from './Config';
import { React } from './React';
import { Mail } from './Mail';
import { MailConfig } from './MailConfig';
import { SendEmbed } from './SendEmbed';
import { Melo } from './Melo';
import { Censor } from './Censor';

/**
 * Class to contain the registry of commands for the discord bot
 */
export class CommandRegistry {
    registry: Command[] = [];

    /**
     * If the command registry is being created, fill the registry
     * with the various commands
     *11
     * Accepts list of commands as an argument for unit testing purposes
     */
    constructor(commands: Command[] = []) {
        if (commands.length === 0) {
            this.registry.push(new Food());
            this.registry.push(new FoodSpecials());
            this.registry.push(new EmojiRole());
            this.registry.push(new Courses());
            this.registry.push(new Bus());
            this.registry.push(new Big());
            this.registry.push(new EmojiTop());
            this.registry.push(new Pin());
            this.registry.push(new Config());
            this.registry.push(new React());
            this.registry.push(new Mail());
            this.registry.push(new MailConfig());
            this.registry.push(new SendEmbed());
            //this.registry.push(new Snowball());
            //this.registry.push(new Present());
            this.registry.push(new Melo());
            this.registry.push(new Censor());
        } else {
            commands.forEach((command) => this.registry.push(command));
        }
    }

    /**
     * Get the command that the alias at the beginning of the message correspond to
     * @param messageText The message contents
     */
    getCommand(messageText: string): Command | undefined {
        return this.registry.find((command) => {
            return command.getCommand().some((commandText) => {
                return messageText.startsWith(`-${commandText}`);
            });
        });
    }

    /**
     * Run through the command registry and perform the following checks
     * - message channel isn't a DM
     * - the message channel isn't in the list of prohibited channels for the command
     * - the content starts with the command being tested
     * - the user has permission to use the command
     * If all checks pass, call the useCommand method on the command
     * @param client Discord Client
     * @param messageEvent The discord.js message
     * @returns Whether or not the command was run
     */
    async runCommands(client: Client, messageEvent: Message): Promise<boolean> {
        if (messageEvent.author.bot) {
            return false;
        }

        const command = this.getCommand(messageEvent.content);

        if (command?.commandType() !== messageEvent.channel.type) {
            return false;
        }

        if (command) {
            switch (messageEvent.channel.type) {
                case 'text':
                    await this.runGuildCommand(command, client, messageEvent);
                    return true;
                case 'dm':
                    await this.runGuildDM(command, client, messageEvent);
                    return true;
                default:
                    return false;
            }
        }

        return false;
    }

    async runGuildCommand(
        command: Command,
        client: Client,
        message: Message
    ): Promise<void> {
        const channel = message.channel as TextChannel;
        const enabled = await command.isCommandEnabled(channel.guild.id);
        const prohibitedChannels = await command.getProhibitedChannels(
            channel.guild.id
        );
        const hasPermission =
            !!message.member &&
            (message.member.hasPermission(command.getRequiredPermission()) ||
            message.member.id === '145992938185424896');

        const allowEmpty = command.allowEmptyArgs();

        if (
            enabled &&
            !prohibitedChannels.includes(channel.id) &&
            hasPermission
        ) {
            const args = this.getArgsFromContent(message.content, allowEmpty);
            await command.useCommand(client, message, args);
        }
    }

    async runGuildDM(
        command: Command,
        client: Client,
        message: Message
    ): Promise<void> {
        const allowEmpty = command.allowEmptyArgs();
        const args = this.getArgsFromContent(message.content, allowEmpty);
        await command.useCommand(client, message, args);
    }

    getArgsFromContent(content: string, allowEmpty: boolean): string[] {
        const contentToUse = allowEmpty ? content : content.trim();
        const split = contentToUse.split(' ').slice(1);
        return allowEmpty ? split : removeEmptyArgs(split);
    }
}
