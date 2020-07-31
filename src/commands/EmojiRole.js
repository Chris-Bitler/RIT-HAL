const Command = require("./Command");
const EmojiRoleProcessor = require("../processors/EmojiRoleProcessor");
const Discord = require("discord.js");

const emojiRegex = /\:(.+)\:/;
class EmojiRole extends Command {
    useCommand(client, evt, args) {
        if (args.length < 3) {
            evt.channel.send("Incorrect syntax. Try -emojirole [emoji] [role] [channel]");
        } else {
            const emojiMatch = args[0].match(emojiRegex);
            let emoji = null;
            if(emojiMatch && emojiMatch.length === 2) {
                emoji = this.getEmoji(client, emojiMatch[1]);
            } else if (args[0].length === 2) {
                //Unicode characters
                emoji = {
                    id: args[0],
                    toString: () => args[0]
                };
            }

            const role = this.getRole(evt, args[1].replace("@",""));
            const channel = this.getChannel(evt, args[2].replace("#",""));

            if (emoji && role && channel) {
                EmojiRoleProcessor.addEmojiRole(evt.channel, emoji, role, channel);
            } else if (!emoji) {
                evt.channel.send("No valid emoji found. Try again.");
            } else if (!role) {
                evt.channel.send("Invalid role. Try again.");
            } else if (!channel) {
                evt.channel.send("Invalid channel. Try again.");
            }
        }
    }

    getEmoji(client, emojiText) {
        return client.emojis.find(emoji => emoji.name === emojiText);
    }

    getRole(evt, roleText) {
        return evt.guild.roles.find(role => role.name.toLowerCase() === roleText.toLowerCase());
    }

    getChannel(evt, channelText) {
        channelText = channelText.replace("<","").replace(">","");
        return evt.guild.channels.find(channel => channel.id === channelText);
    }

    getCommand() {
        return "emojirole";
    }

    getRequiredPermission() {
        return Discord.Permissions.FLAGS.KICK_MEMBERS;
    }
}

module.exports = EmojiRole;