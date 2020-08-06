import { Alarm } from "../types/Alarm";
import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { Alarm as AlarmModel } from "../models/Alarm";
import { getErrorEmbed, getInformationalEmbed } from "../utils/EmbedUtil";

const MS_IN_23_HOURS = 82800000;

/**
 * Class to manage alarms that send messages in discord channels
 */
export class AlarmProcessor {
    static instance: AlarmProcessor;
    alarms: Alarm[] = [];

    /**
     * Get the singleton instance of AlarmProcessor
     */
    static getInstance(): AlarmProcessor {
        if (!this.instance) {
            this.instance = new AlarmProcessor();
        }

        return this.instance;
    }

    /**
     * Create an alarm and store it in the in-memory array and database
     * @param message Discord.js message from the -alarm command
     * @param channel The channel to send the alarm message in
     * @param hours The hours [0-12] to send the alarm at
     * @param minutes The minutes [0-59] to send the alarm at
     * @param messageToSend The message to send as the alarm
     */
    async createAlarm(
        message: Message,
        channel: TextChannel,
        hours: number,
        minutes: number,
        messageToSend: string
    ): Promise<void> {
        if (message.guild) {
            try {
                const alarm = await AlarmModel.create({
                    lastUsed: 0,
                    channelId: channel.id,
                    serverId: message.guild.id,
                    hours,
                    minutes,
                    messageToSend
                });

                this.alarms.push({
                    hours,
                    minutes,
                    message: messageToSend,
                    lastSent: 0,
                    channelId: channel.id,
                    serverId: message.guild.id,
                    id: alarm.id
                });

                let amPm = "am";
                if (hours > 12) {
                    amPm = "pm";
                }
                let hoursToSend = hours;
                if (hours !== 12) {
                    hoursToSend = hours % 12;
                }

                await message.channel.send(
                    getInformationalEmbed(
                        "Alarm created",
                        `An alarm for ${channel} was created to go off at ${hoursToSend}:${minutes} ${amPm}
                        saying ${message}`
                    )
                );
            } catch (error) {
                // TODO: Log error to sentry
            }
        }
    }

    /**
     * Get the alarms for a specific server from the command message
     * @param message The message to use to get the guild id
     */
    async getAlarms(message: Message): Promise<Alarm[]> {
        const serverId = message.guild?.id;
        if (serverId) {
            return this.alarms.filter((alarm) => {
                return alarm.serverId === serverId;
            });
        } else {
            return [];
        }
    }

    /**
     * Load the alarms from the database into memory
     */
    async loadAlarms(): Promise<void> {
        const alarms = await AlarmModel.findAll();
        for (const alarm of alarms) {
            this.alarms.push({
                lastSent: alarm.lastUsed,
                hours: alarm.hours,
                minutes: alarm.minutes,
                message: alarm.messageToSend,
                channelId: alarm.channelId,
                serverId: alarm.serverId,
                id: alarm.id
            });
        }
    }

    /**
     * Send the alarm list embed.
     * This function mainly handles formatting and sending.
     * @param message The message from the command
     */
    async sendAlarmListEmbed(message: Message): Promise<void> {
        const embed = new MessageEmbed();
        const alarms = await this.getAlarms(message);
        let description = "";
        embed.setTitle("Alarms");
        if (alarms && alarms.length > 0) {
            for (const alarm of alarms) {
                const hours = alarm.hours !== 12 ? alarm.hours % 12 : 12;
                const minutes = alarm.minutes;
                const amPm = alarm.hours >= 12 ? "pm" : "am";
                description +=
                    `**ID:** ${alarm.id}\n` +
                    `**Time:** ${hours}:${minutes} ${amPm}\n` +
                    `**Message:** ${alarm.message}\n\n`;
            }

            embed.addField("Alarms", description);

            await message.channel.send(embed);
        } else {
            await message.channel.send(getErrorEmbed("No alarms found"));
        }
    }

    /**
     * Delete an alarm from the database and in-memory storage
     * @param message The message from the command
     * @param id The id of the alarm
     */
    async deleteAlarm(message: Message, id: string): Promise<void> {
        const alarm = await AlarmModel.findOne({
            where: {
                id
            }
        });
        const guild = message.guild;
        if (alarm) {
            if (guild) {
                if (alarm.serverId === guild.id) {
                    await AlarmModel.destroy({
                        where: {
                            id
                        }
                    });
                    this.alarms = this.alarms.filter((alarm) => {
                        return alarm.id !== id;
                    });
                    await message.channel.send(
                        getInformationalEmbed(
                            "Alarm deleted",
                            `The alarm with the id ${id} was deleted.`
                        )
                    );
                } else {
                    await message.channel.send(
                        getErrorEmbed(
                            "That alarm doesn't belong to this server."
                        )
                    );
                }
            }
        } else {
            message.channel.send(getErrorEmbed("No alarm with that id exists"));
        }
    }

    /**
     * Tick the alarms, sending the alarm messages as necessary
     * @param client The discord.js client
     */
    async tickAlarms(client: Client): Promise<void> {
        for (const alarm of this.alarms) {
            const now = Date.now();
            const date = new Date();
            if (
                alarm.lastSent + MS_IN_23_HOURS < now &&
                date.getHours() + 1 >= alarm.hours &&
                date.getMinutes() + 1 >= alarm.minutes
            ) {
                const guild = client.guilds.resolve(alarm.serverId);
                if (guild) {
                    const channel = client.channels.resolve(
                        alarm.channelId
                    ) as TextChannel;
                    if (channel) {
                        await channel.send(alarm.message);
                        alarm.lastSent = now;
                        await AlarmModel.update(
                            {
                                lastUsed: now
                            },
                            {
                                where: {
                                    id: alarm.id
                                }
                            }
                        );
                    }
                }
            }
        }
    }
}
