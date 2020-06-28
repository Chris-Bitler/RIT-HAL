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