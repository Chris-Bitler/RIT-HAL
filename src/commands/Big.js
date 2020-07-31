const Command = require("./Command");
const { MessageAttachment } = require("discord.js");
const EmojiUtil = require("../utils/EmojiUtil");

class Big extends Command {
    useCommand(client, evt, args) {
        if (args.length >= 1) {
            console.log(args[0]);
            const trimmed = args[0].replace("<", "").replace(">", "");
            const split = trimmed.split(":");
            if (split.length === 3) {
                const emojiID = split[2];
                EmojiUtil.getEmojiExtension(emojiID).then((url) => {
                    const attachment = new MessageAttachment(url);
                    evt.channel.send(attachment);
                }).catch(() => evt.channel.send("No valid emoji found"));
            } else {
                evt.channel.send("No valid emoji detected");
            }
        } else {
            evt.channel.send("Please use an emoji to embiggen");
        }
    }

    getCommand() {
        return "big";
    }
}

module.exports = Big;