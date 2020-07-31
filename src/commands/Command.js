class Command {
    useCommand(client, evt, args) {
        throw new Error("You need to implement useCommand");
    }

    getCommand() {
        throw new Error("You need to implement getCommand");
    }

    getRequiredPermission() {
        return false;
    }
}

module.exports = Command;