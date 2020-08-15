import { Command } from "./Command";
import { Client, Message, Permissions, TextChannel } from "discord.js";
import { getErrorEmbed } from "../utils/EmbedUtil";
import { mergeArgs } from "../utils/StringUtil";
import { AlarmProcessor } from "../processors/AlarmProcessor";

// Represents an invalid hour/minute for getTime()
const INVALID_TIME = -1;

/**
 * Command to administrate server alarms
 */
export class Alarm extends Command {
    alarmProcessor = AlarmProcessor.getInstance();

    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (args.length >= 1 && evt.channel.type === "text") {
            const type = args[0].toLowerCase();
            switch (type) {
                case "create":
                    await this.createAlarm(evt, args);
                    break;
                case "list":
                    await this.listAlarms(evt);
                    break;
                case "delete":
                    await this.deleteAlarm(evt, args);
                    break;
                default:
                    await evt.channel.send(
                        getErrorEmbed(
                            "Invalid command. Type `-alarm` to see the possible arguments"
                        )
                    );
            }
        } else {
            if (evt.channel.type === "text") {
                await evt.channel.send(
                    getErrorEmbed(
                        "Incorrect syntax. Try `-alarm [create|list|delete]`.\n" +
                            "Use of them to see the syntax for it"
                    )
                );
            }
        }
    }

    getConfigBase(): string {
        return "alarm";
    }

    getCommand(): string[] {
        return ["alarm"];
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.ADMINISTRATOR;
    }

    /**
     * Create an alarm given the correct arguments, or send error embed if not
     * @param evt The command message
     * @param args The args for the command
     */
    async createAlarm(evt: Message, args: string[]): Promise<void> {
        if (args.length >= 5) {
            // TODO: Replace this with regex
            const channel = args[1]
                .replace("<", "")
                .replace(">", "")
                .replace("#", "");
            const [hours, minutes] = this.getTime(args[2], args[3]);
            if (hours === INVALID_TIME || minutes === INVALID_TIME) {
                await evt.channel.send(
                    getErrorEmbed(
                        "Invalid time. Make sure that it is in the form hours:minutes [am|pm]" +
                            " and that the hours are 12 or less and the minutes are less than 60"
                    )
                );
                return;
            }

            const messageToSend = mergeArgs(4, args);
            const guild = evt.guild;
            if (guild) {
                const guildChannel = guild.channels.resolve(channel);
                if (guildChannel) {
                    if (guildChannel.type === "text") {
                        const channelToUse = guildChannel as TextChannel;
                        await this.alarmProcessor.createAlarm(
                            evt,
                            channelToUse,
                            hours,
                            minutes,
                            messageToSend
                        );
                    } else {
                        evt.channel.send(
                            getErrorEmbed(
                                "Target channel needs to be a text channel"
                            )
                        );
                    }
                } else {
                    evt.channel.send(getErrorEmbed("Cannot find channel"));
                }
            } else {
                evt.channel.send(getErrorEmbed("Not a valid guild"));
            }
        } else {
            await evt.channel.send(
                getErrorEmbed(
                    "Incorrect syntax. Try `-alarm create [channel] [time in Hours:Minutes] [am or pm] [message]`"
                )
            );
        }
    }

    /**
     * Convert a timestamp in the form of [hours]:[minutes] [am|pm] to hours/minutes
     * @param time The time string
     * @param amOrPm The AM|PM string
     */
    getTime(time: string, amOrPm: string): [number, number] {
        if (amOrPm.toLowerCase() === "am" || amOrPm.toLowerCase() === "pm") {
            const [hoursString, minutesString] = time.split(":");
            if (hoursString && minutesString) {
                let hours = parseInt(hoursString);
                const minutes = parseInt(minutesString);
                if (hours !== null && minutes !== null) {
                    if (hours <= 12 && minutes < 60) {
                        hours =
                            amOrPm.toLowerCase() === "pm" ? hours + 12 : hours;
                        return [hours, minutes];
                    }
                }
            }
        }

        return [INVALID_TIME, INVALID_TIME];
    }

    /**
     * List the alarms for this server in an embed
     * @param evt The command message
     */
    async listAlarms(evt: Message): Promise<void> {
        await this.alarmProcessor.sendAlarmListEmbed(evt);
    }

    /**
     * Delete an alarm based on a provided id, or error if not enough arguments
     * @param evt The command message
     * @param args The arguments for the command
     */
    async deleteAlarm(evt: Message, args: string[]): Promise<void> {
        if (args.length >= 2) {
            const id = args[1];
            await this.alarmProcessor.deleteAlarm(evt, id);
        } else {
            await evt.channel.send(
                getErrorEmbed(
                    "Incorrect syntax. Try `-alarm delete [id]` where the ID is the ID of the alarm from `-alarm list`"
                )
            );
        }
    }
}
