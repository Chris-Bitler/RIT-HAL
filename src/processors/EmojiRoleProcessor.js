const db = require("../Database");

function addEmojiRole(initialChannel, emote, role, channel) {
    db.database.serialize(() => {
        const stmt = db.database.prepare("INSERT INTO `emojitorole` (`emojiId`,`roleId`,`channelId`) VALUES (?,?,?)");
        stmt.run(
            [
                emote.id,
                role.id,
                channel.id
            ],
            (err) => {
                if (err === null) {
                    initialChannel.send(`${emote} was added for ${role} in ${channel}`);
                } else {
                    initialChannel.send("An error occurred adding the emoji to role.");
                }
            }
        )
    });
}

function checkReactionToDB(emote, member, channel, reaction) {
    db.database.serialize(() => {
        const emojiId = emote.id ? emote.id : emote.name;
        const stmt = db.database.prepare("SELECT `roleId` FROM `emojitorole` WHERE `emojiId` = ? AND channelId = ? ORDER BY `id` DESC");
        stmt.get([emojiId, channel.id], (err, row) => {
            if (row) {
                const { roleId } = row;
                const role = channel.guild.roles.resolve(roleId);
                if (member.roles.cache.get(roleId)) {
                    member.roles.remove(role);
                    member.send(`Your role **${role.name}** was removed in the RIT discord server.`);
                } else {
                    member.roles.add(role);
                    member.send(`You were given the role **${role.name}** in the RIT discord server.`);
                }

                reaction.users.remove(member.id);
            }
        });
    });
}

module.exports = {
    addEmojiRole,
    checkReactionToDB
};