const Command = require("./Command");
const EmojiProcessor = require("../processors/EmojiProcessor");
const PROHIBITED_CHANNELS = ["401908664018927628"];

class EmojiTop extends Command {
    useCommand(client, evt, args) {
        if (!PROHIBITED_CHANNELS.includes(evt.channel.id)) {
            EmojiProcessor.getTopEmojis(evt);
        }
    }

    getCommand() {
        return "emojitop";
    }
}

module.exports = EmojiTop;