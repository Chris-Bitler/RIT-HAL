import { Alarm } from '../types/Alarm';
import moment from 'moment-timezone';
import { Client, Guild, MessageEmbed, TextChannel } from 'discord.js';
import { Alarm as AlarmModel } from '../models/Alarm';
import { getErrorEmbed, getInformationalEmbed } from '../utils/EmbedUtil';
import * as sentry from '@sentry/node';
import { DateTime } from 'luxon';
import {WeatherProcessor} from "./WeatherProcessor";
import {WeatherResponse} from "../types/Weather";

const MS_IN_23_HOURS = 82800000;
const DATE_FORMAT = 'MM/dd/yy hh:mm:ss a ZZZZ';

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
     * @param guild The guild the command was used in
     * @param commandChannel The channel the command was sent in
     * @param targetChannel The channel to send the alarm message in
     * @param hours The hours [0-12] to send the alarm at
     * @param minutes The minutes [0-59] to send the alarm at
     * @param meridiem AM or PM
     * @param messageToSend The message to send as the alarm
     */
    async createAlarmTime(
        guild: Guild,
        commandChannel: TextChannel,
        targetChannel: TextChannel,
        hours: number,
        minutes: number,
        meridiem: string,
        messageToSend: string
    ): Promise<void> {
        try {
            let lastUsed = 0;
            const hoursToUse: number = meridiem == 'AM' ? hours : hours + 12;

            // Deal with times that have already passed today
            const current = moment().tz('America/New_York');
            current.hours(hoursToUse);
            current.minutes(minutes);
            if (Date.now() > current.valueOf()) {
                lastUsed = current.valueOf();
            }

            const alarm = await AlarmModel.create({
                lastUsed: lastUsed,
                channelId: targetChannel.id,
                serverId: guild.id,
                hoursToUse,
                minutes,
                messageToSend
            });

            this.alarms.push({
                type: 'time',
                hours: hoursToUse,
                minutes,
                message: messageToSend,
                lastSent: lastUsed,
                channelId: targetChannel.id,
                serverId: guild.id,
                id: alarm.id
            });

            let minutesToSend = minutes.toString();
            if (minutes < 10) {
                minutesToSend = `0${minutesToSend}`;
            }
            await commandChannel.send(
                getInformationalEmbed(
                    'Alarm created',
                    `An alarm for ${targetChannel} was created to go off at ${hours}:${minutesToSend} ${meridiem.toUpperCase()} saying ${messageToSend}`
                )
            );
        } catch (error) {
            sentry.captureException(error);
        }
    }

    /**
     * Create a date-based alarm
     * @param guild The guild the command was used in
     * @param commandChannel The channel the command was used in
     * @param targetChannel The channel the alarm should be sent in
     * @param date The date it should be sent at
     * @param messageToSend The message to send
     */
    async createAlarmDate(
        guild: Guild,
        commandChannel: TextChannel,
        targetChannel: TextChannel,
        date: Date,
        messageToSend: string
    ): Promise<void> {
        if (guild) {
            try {
                const alarm = await AlarmModel.create({
                    channelId: targetChannel.id,
                    serverId: guild.id,
                    messageToSend,
                    date: date.getTime(),
                    sent: false
                });

                this.alarms.push({
                    type: 'date',
                    date: date.getTime(),
                    sent: false,
                    message: messageToSend,
                    channelId: targetChannel.id,
                    serverId: guild.id,
                    id: alarm.id
                });

                let luxonDate = DateTime.fromJSDate(date);
                luxonDate = luxonDate.setZone('America/New_York');

                await commandChannel.send(
                    getInformationalEmbed(
                        'Alarm created',
                        `An alarm for ${targetChannel} was created to go off at ${luxonDate.toFormat(
                            DATE_FORMAT
                        )} saying ${messageToSend}`
                    )
                );
            } catch (error) {
                sentry.captureException(error);
            }
        }
    }

    /**
     * Get the alarms for a specific server from the command message
     * @param guild The guild the command was used in
     */
    getAlarms(guild: Guild): Alarm[] {
        const serverId = guild.id;
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
            if (alarm.type === 'time') {
                this.alarms.push({
                    type: alarm.type,
                    lastSent: alarm.lastUsed,
                    hours: alarm.hours ?? 0,
                    minutes: alarm.minutes ?? 0,
                    message: alarm.messageToSend,
                    channelId: alarm.channelId,
                    serverId: alarm.serverId,
                    id: alarm.id
                });
            } else if (alarm.type === 'date') {
                this.alarms.push({
                    type: alarm.type,
                    message: alarm.messageToSend,
                    channelId: alarm.channelId,
                    serverId: alarm.serverId,
                    id: alarm.id,
                    date: alarm.date ?? 0,
                    sent: alarm.sent ?? false
                });
            }
        }
    }

    /**
     * Send the alarm list embed.
     * This function mainly handles formatting and sending.
     * @param guild The guild the command was sent in
     * @param commandChannel The channel the command was sent in
     */
    async sendAlarmListEmbed(
        guild: Guild,
        commandChannel: TextChannel
    ): Promise<void> {
        const embed = new MessageEmbed();
        const alarms = this.getAlarms(guild);
        let description = '';
        embed.setTitle('Alarms');
        if (alarms && alarms.length > 0) {
            for (const alarm of alarms) {
                if (alarm.type === 'time') {
                    const hours = alarm.hours !== 12 ? alarm.hours % 12 : 12;
                    const minutes = alarm.minutes;
                    const amPm = alarm.hours >= 12 ? 'pm' : 'am';
                    description +=
                        `**ID:** ${alarm.id}\n` +
                        `**Time:** ${hours}:${
                            minutes >= 10 ? minutes : `0${minutes}`
                        } ${amPm}\n` +
                        `**Message:** ${alarm.message}\n\n`;
                } else if (alarm.type === 'date') {
                    let date = DateTime.fromMillis(alarm.date);
                    date = date.setZone('America/New_York');
                    const formattedDate = date.toFormat(
                        'MM/dd/yy hh:mm:ss a ZZZZ'
                    );
                    description +=
                        `**ID:** ${alarm.id}\n` +
                        `**Date:** ${formattedDate}\n` +
                        `**Message:** ${alarm.message}\n` +
                        `**Sent:** ${alarm.sent}\n\n`;
                }
            }

            embed.addField('Alarms', description);

            await commandChannel.send(embed);
        } else {
            await commandChannel.send(getErrorEmbed('No alarms found'));
        }
    }

    /**
     * Delete an alarm from the database and in-memory storage
     * @param guild the guild the command was used in
     * @param commandChannel the channel the command was used in
     * @param id The id of the alarm
     */
    async deleteAlarm(
        guild: Guild,
        commandChannel: TextChannel,
        id: string
    ): Promise<void> {
        const alarm = await AlarmModel.findOne({
            where: {
                id
            }
        });
        if (alarm && guild) {
            if (alarm.serverId === guild.id) {
                await AlarmModel.destroy({
                    where: {
                        id
                    }
                });

                this.alarms = this.alarms.filter((alarm) => {
                    return alarm.id !== id;
                });

                await commandChannel.send(
                    getInformationalEmbed(
                        'Alarm deleted',
                        `The alarm with the id ${id} was deleted.`
                    )
                );
            } else {
                await commandChannel.send(
                    getErrorEmbed('That alarm doesn\'t belong to this server.')
                );
            }
        } else {
            await commandChannel.send(
                getErrorEmbed('No alarm with that id exists')
            );
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async sendAlarm(client: Client, alarm: Alarm) {
        const guild = client.guilds.resolve(alarm.serverId);
        const now = Date.now();
        if (guild) {
            const channel = client.channels.resolve(
                alarm.channelId
            ) as TextChannel;
            if (channel) {
                const regex = /{fn:(.*?)}/gm;
                let messageToSend = alarm.message.replace(regex, '');
                messageToSend = messageToSend === '' ? ' ' : messageToSend;
                await channel.send(messageToSend);
                if (alarm.type === 'time') {
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
                } else if (alarm.type === 'date') {
                    alarm.sent = true;
                    await AlarmModel.update(
                        {
                            sent: true
                        },
                        {
                            where: {
                                id: alarm.id
                            }
                        }
                    );
                }
                await this.runAlarmFunctions(client, alarm);
            }
        }
    }

    /**
     * Tick the alarms, sending the alarm messages as necessary
     * @param client The discord.js client
     */
    async tickAlarms(client: Client): Promise<void> {
        for (const alarm of this.alarms) {
            const now = Date.now();
            const date = moment().tz('America/New_York');
            if (alarm.type === 'date') {
                const timePassed = alarm.date < Date.now();
                if (timePassed && !alarm.sent) {
                    await this.sendAlarm(client, alarm);
                }
            } else if (alarm.type === 'time') {
                const sameHourMoreMinutes =
                    date.hours() === alarm.hours &&
                    date.minutes() >= alarm.minutes;
                const moreHours = date.hours() > alarm.hours;
                if (
                    alarm.lastSent + MS_IN_23_HOURS < now &&
                    (sameHourMoreMinutes || moreHours)
                ) {
                    await this.sendAlarm(client, alarm);
                }
            }
        }
    }

    async runAlarmFunctions(client: Client, alarm: Alarm) {
        const regex = /{fn:(.*?)}/g;
        const functions = alarm.message.matchAll(regex);
        for (const match of functions) {
            if (match.length > 1) {
                const parts = match[1].trim().split(' ');
                if (parts.length > 0) {
                    const mappedFn = this.fnMapper[parts[0]]
                    await mappedFn(client, alarm, parts.splice(1));
                }
            }
        }
    }

    async sendWeatherEmbed(client: Client, alarm: Alarm, args: string[]) {
        const zip = args?.[0];
        if (zip) {
            const weather = await WeatherProcessor.getWeather(zip);
            if (!(weather instanceof Error)) {
                const embed = WeatherProcessor.getEmbed(zip, weather);
                const channel = client.guilds.resolve(alarm.serverId)?.channels?.resolve(alarm.channelId);
                if (channel instanceof TextChannel) {
                    await channel.send(embed);
                }
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    fnMapper: {[key: string]: Function} = {
        weather: this.sendWeatherEmbed
    }
}
