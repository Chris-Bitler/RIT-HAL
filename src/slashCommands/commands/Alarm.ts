import {CommandContext, CommandOptionType, Message, SlashCreator} from 'slash-create';
import { Client, Guild, TextChannel } from 'discord.js';
import { ExtendedSlashCommand } from '../ExtendedSlashCommand';
import { AlarmProcessor } from '../../processors/AlarmProcessor';
import { getChronoCustom } from '../../utils/DateUtil';
import {LogProcessor} from '../../processors/LogProcessor';

export class Alarm extends ExtendedSlashCommand {
    client: Client;
    constructor(client: Client, creator: SlashCreator) {
        super(creator, {
            name: 'alarm',
            description:
                'Set an alarm to go off at a specific time every day or at a specific date/time',
            requiredPermissions: ['ADMINISTRATOR'],
            options: [
                {
                    type: CommandOptionType.SUB_COMMAND,
                    name: 'date',
                    description: 'date specific type alarm',
                    options: [
                        {
                            type: CommandOptionType.STRING,
                            name: 'date',
                            description:
                                'the date/time for the alarm to go off at',
                            required: true
                        },
                        {
                            type: CommandOptionType.CHANNEL,
                            name: 'channel',
                            description: 'the channel to send the message in',
                            required: true
                        },
                        {
                            type: CommandOptionType.STRING,
                            name: 'message',
                            description: 'the message to send in the alarm',
                            required: true
                        }
                    ]
                },
                {
                    type: CommandOptionType.SUB_COMMAND,
                    name: 'time',
                    description: 're-occurring alarm',
                    options: [
                        {
                            type: CommandOptionType.INTEGER,
                            name: 'hours',
                            description:
                                'the hour (0-12) for the alarm to go off at',
                            required: true
                        },
                        {
                            type: CommandOptionType.INTEGER,
                            name: 'minutes',
                            description:
                                'the minute (0-59) for the alarm to go off at',
                            required: true
                        },
                        {
                            type: CommandOptionType.STRING,
                            name: 'meridiem',
                            description: 'AM or PM',
                            required: true,
                            choices: [
                                {
                                    name: 'morning',
                                    value: 'AM'
                                },
                                {
                                    name: 'afternoon',
                                    value: 'PM'
                                }
                            ]
                        },
                        {
                            type: CommandOptionType.CHANNEL,
                            name: 'channel',
                            description: 'the channel to send the message in',
                            required: true
                        },
                        {
                            type: CommandOptionType.STRING,
                            name: 'message',
                            description: 'the message to send in the alarm',
                            required: true
                        }
                    ]
                },
                {
                    type: CommandOptionType.SUB_COMMAND,
                    name: 'list',
                    description: 'list the alarms'
                },
                {
                    type: CommandOptionType.SUB_COMMAND,
                    name: 'archive',
                    description: 'list the archived alarms'
                },
                {
                    type: CommandOptionType.SUB_COMMAND,
                    name: 'delete',
                    description: 'delete an alarm',
                    options: [
                        {
                            type: CommandOptionType.STRING,
                            name: 'alarm-id',
                            description: 'alarm id',
                            required: true
                        }
                    ]
                }
            ]
        });

        this.client = client;
    }

    async run(context: CommandContext) {
        LogProcessor.getLogger().debug(`Debug: Options: ${JSON.stringify(context.options)} | ${context.options}`);
        const { guild, channel } = this.getGuildChannel(this.client, context);
        if (guild && channel) {
            const hasPermission = this.hasPermission(context);
            if (hasPermission) {
                // context.subcommands is sometimes empty even if subcommand used
                // use first option instead
                const type = Object.keys(context?.options)?.[0] ?? null;
                switch (type) {
                    case 'date':
                        await this.handleDateCommand(guild, channel, context);
                        break;
                    case 'time':
                        await this.handleTimeCommand(guild, channel, context);
                        break;
                    case 'list':
                        await this.handleListCommand(guild, channel, context);
                        break;
                    case 'archive':
                        await this.handleArchiveCommand(guild, channel, context);
                        break;
                    case 'delete':
                        await this.handleDeleteCommand(guild, channel, context);
                        break;
                    default:
                        await context.send('Invalid command');
                        break;
                }
            }
        }
    }

    async handleDateCommand(
        guild: Guild,
        commandChannel: TextChannel,
        context: CommandContext
    ) {
        const dateOptions = context.options.date;
        LogProcessor.getLogger().debug(`Date alarm command called: ${JSON.stringify(context.data)}`)

        if (typeof dateOptions === 'object') {
            const date = dateOptions.date as string;
            const channel = dateOptions.channel as string;
            const message = dateOptions.message as string;
            const chrono = getChronoCustom();
            const parsedDate = chrono.parseDate(date);
            if (parsedDate) {
                const targetChannel = guild.channels.resolve(channel);
                if (targetChannel && targetChannel instanceof TextChannel) {
                    await AlarmProcessor.getInstance().createAlarmDate(
                        guild,
                        commandChannel,
                        targetChannel,
                        parsedDate,
                        message
                    );
                    await context.acknowledge(false);
                    return;
                } else {
                    await context.send('Unknown channel. Please try again.', {
                        ephemeral: true
                    });
                    return;
                }
            }
        }

        await context.send(
            'Unknown error. Please check arguments and try again',
            { ephemeral: true }
        );
    }

    async handleTimeCommand(
        guild: Guild,
        commandChannel: TextChannel,
        context: CommandContext
    ) {
        const timeOptions = context.options.time;
        LogProcessor.getLogger().debug(`Time alarm command called: ${JSON.stringify(context.data)}`)
        if (typeof timeOptions === 'object') {
            const hours = timeOptions.hours as number;
            const minutes = timeOptions.minutes as number;
            const meridiem = timeOptions.meridiem as string;
            const channel = timeOptions.channel as string;
            const message = timeOptions.message as string;
            const targetChannel = guild.channels.resolve(channel);
            if (targetChannel && targetChannel instanceof TextChannel) {
                await AlarmProcessor.getInstance().createAlarmTime(
                    guild,
                    commandChannel,
                    targetChannel,
                    hours,
                    minutes,
                    meridiem,
                    message
                );
                await context.acknowledge(false);
                return;
            } else {
                await context.send('Unknown channel. Please try again.', {
                    ephemeral: true
                });
                return;
            }
        }

        await context.send(
            'Unknown error. Please check arguments and try again',
            { ephemeral: true }
        );
    }

    async handleListCommand(
        guild: Guild,
        commandChannel: TextChannel,
        context: CommandContext
    ) {
        LogProcessor.getLogger().debug(`List alarm command called: ${JSON.stringify(context.data)}`)
        await AlarmProcessor.getInstance().sendAlarmListEmbed(
            guild,
            commandChannel
        );
        await context.acknowledge(false);
    }

    async handleArchiveCommand(
        guild: Guild,
        commandChannel: TextChannel,
        context: CommandContext
    ) {
        LogProcessor.getLogger().debug(`Archive alarm command called: ${JSON.stringify(context.data)}`)
        await AlarmProcessor.getInstance().sendAlarmListEmbed(
            guild,
            commandChannel,
            true
        );
        await context.acknowledge(false);
    }

    async handleDeleteCommand(
        guild: Guild,
        commandChannel: TextChannel,
        context: CommandContext
    ) {
        const deleteOptions = context.options.delete;
        LogProcessor.getLogger().debug(`Delete alarm command called: ${JSON.stringify(context.data)}`)
        if (typeof deleteOptions === 'object') {
            const alarm = deleteOptions['alarm-id'] as string;
            await AlarmProcessor.getInstance().deleteAlarm(
                guild,
                commandChannel,
                alarm
            );
        }
    }

    onError(err: Error, ctx: CommandContext): Promise<boolean | Message> | undefined {
        const result = super.onError(err, ctx);
        LogProcessor.getLogger().error(`Error message: ${err.message}, stack: ${err.stack}`);
        return result;
    }
}
