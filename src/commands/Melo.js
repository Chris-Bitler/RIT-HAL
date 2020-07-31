const Command = require("./Command");
const disabled = true;

class Melo extends Command {
    useCommand(client, evt, args) {
        if (!disabled) {
            evt.react("🍈");
        }
    }

    getCommand() {
        return "mod melo";
    }
}

module.exports = Melo;