/**
 * This file is part of RIT-HAL.
 *
 * RIT-HAL is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * RIT-HAL is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with RIT-HAL.  If not, see <https://www.gnu.org/licenses/>.
 */

const Command = require("./Command");
const Discord = require("discord.js");
const DateUtil = require("../utils/DateUtil");
const ModProcessor = require("../processors/ModProcessor");
const moment = require('moment-timezone');

class Mod extends Command {
    useCommand(client, evt, args) {
        if (args && args[0] !== undefined) {
            let cmdArgs;
            const channel = evt.channel;
            const sender = evt.member;
            switch(args[0].toLowerCase()) {
                case "mute":
                    cmdArgs = this.parseArgsTime(evt, args, "mute");
                    this.muteUser(channel, sender, cmdArgs);
                    break;
                case "unmute":
                    cmdArgs = this.parseArgsTime(evt, args, "mute");
                    this.unmuteUser(channel, sender, cmdArgs);
                    break;
                case "ban":
                    cmdArgs = this.parseArgsTime(evt, args, "ban");
                    this.banUser(channel, sender, cmdArgs);
                    break;
                case "warn":
                    cmdArgs = this.parseArgs(evt, args);
                    this.warnUser(channel, sender, cmdArgs);
                    break;
                case "kick":
                    cmdArgs = this.parseArgs(evt, args);
                    this.kickUser(channel, sender, cmdArgs);
                    break;
                case "actions":
                    const name = args.length >= 2 ? args[1] : "N/A";
                    this.listActions(channel, sender, name);
                    break;
                case "birb":
                    this.birb(client, evt);
            }
        }
    }

    getCommand() {
        return "mod";
    }

    getRequiredPermission() {
        return Discord.Permissions.FLAGS.KICK_MEMBERS
    }

    parseArgsTime(evt, args, type) {
        let cmdArgs = {
            target: null,
            time: null,
            reason: null
        };

        if (args.length >= 2) {
            cmdArgs.target = evt.mentions.members.first();
        }

        if (args.length >= 3) {
            const remainder = args.slice(2).join(" ").split("|");
            cmdArgs.time = DateUtil.parseModDateString(remainder[0].trim());
            cmdArgs.reason = remainder.length > 1 && remainder[1].trim();
        } else {
            cmdArgs.time = this.getDefaultLength(type);
            cmdArgs.reason = type;
        }

        return cmdArgs;
    }

    getDefaultLength(type) {
        if (type === "mute") {
            return 60*60*1000;
        } else if (type === "ban") {
            DateUtil.parseModDateString("9999 years");
        } else {
            return 60*1000;
        }
    }

    parseArgs(evt, args) {
        let cmdArgs = {
            target: null,
            reason: null
        };

        if (args.length >= 2) {
            cmdArgs.target = evt.mentions.members.first();
        }

        if (args.length >= 3) {
            const remainder = args.slice(2).join(" ");
            cmdArgs.reason = remainder;
        }

        return cmdArgs;
    }

    muteUser(channel, sender, cmdArgs) {
        if (cmdArgs.target && cmdArgs.time && cmdArgs.reason) {
            ModProcessor.muteUser(cmdArgs.target, sender, cmdArgs.reason, cmdArgs.time);

            const expirationDate = moment(Date.now() + cmdArgs.time);
            const expirationDateString = moment.tz(expirationDate, "America/New_York").format("MMMM Do YYYY, h:mm:ss a");
            channel.send(`${cmdArgs.target} has been muted for ${cmdArgs.reason} until ${expirationDateString}`);
            cmdArgs.target.send("You have been muted for _" + cmdArgs.reason + "_ until " + expirationDateString + " EST by **" + sender.displayName + "**");
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod mute [user ping] [time] | [reason]`);
        }
    }

    unmuteUser(channel, sender, cmdArgs) {
        if (cmdArgs.target) {
            ModProcessor.unmuteUser(cmdArgs.target);

            channel.send(`${cmdArgs.target} has been unmuted.`);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod unmute [user ping]`);
        }
    }

    kickUser(channel, sender, cmdArgs) {
        if (cmdArgs.target && cmdArgs.reason) {
            ModProcessor.kickUser(cmdArgs.target, sender, cmdArgs.reason);

            channel.send(`${cmdArgs.target} has been kicked.`);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod kick [user ping] [reason]`);
        }
    }

    banUser(channel, sender, cmdArgs) {
        if (cmdArgs.target && cmdArgs.time && cmdArgs.reason) {
            const expirationDate = moment(Date.now() + cmdArgs.time);
            const expirationDateString = moment.tz(expirationDate, "America/New_York").format("MMMM Do YYYY, h:mm:ss a");

            ModProcessor.banUser(cmdArgs.target, sender, cmdArgs.reason, cmdArgs.time);
            channel.send(`${cmdArgs.target} has been banned for _${cmdArgs.reason}_ until ${expirationDateString}.`);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod ban [user ping] [time] | [reason]`);
        }
    }

    warnUser(channel, sender, cmdArgs) {
        if (cmdArgs.target && cmdArgs.reason) {
            ModProcessor.warnUser(cmdArgs.target, sender, cmdArgs.reason);
            channel.send(`${cmdArgs.target} has been warned for _${cmdArgs.reason}_.`);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod warn [user ping] [reason]`);
        }
    }

    listActions(channel, sender, name) {
        const members = channel.guild.members.cache.filter((member) => member.user.username.toLowerCase().includes(name.toLowerCase()));
        if (members.size > 0) {
            const id = members.first().id;
            ModProcessor.fetchPunishments(id).then((rows) => {
                const embed = new Discord.MessageEmbed().setTitle(`Found punishments - ${members.first().nickname || members.first().displayName}`);
                rows.forEach((action) => {
                    const expirationDateString = moment.tz(action.expiration, "America/New_York").format("MMMM Do YYYY, h:mm:ss a");
                    embed.addField(
                        `Punishment`,
                        `Name: ${action.userName}\n` +
                        `Type: ${action.type}\n` +
                        `Reason: ${action.reason}\n` +
                        `Expiration: ${action.expiration ? expirationDateString : "N/A"}\n` +
                        `Active: ${action.active ? "True" : "False"}\n` +
                        `By: ${action.punisherName}\n\n`
                    );
                });

                channel.send(embed);
            });
        } else {
            channel.send("User not found.");
        }
    }

    birb(client, evt) {
        evt.react(client.emojis.resolveID("672619293585965098"));
    }
}

module.exports = Mod;