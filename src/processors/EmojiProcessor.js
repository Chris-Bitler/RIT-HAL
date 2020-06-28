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
const {database} = require("../Database");
const Discord = require("discord.js");

const regex = /<.?(:.+?:)[0-9]+?>/g
const countEmojis = (message) => {
    const matches = message.matchAll(regex);
    const emojis = {};
    let match = matches.next();
    while (!match.done) {
        const emoji = match.value[1];
        if (emoji) {
            if (emojis[emoji]) {
                emojis[emoji]++;
            } else {
                emojis[emoji] = 1;
            }
        }
        match = matches.next();
    }

    return emojis;
};

const logEmojis = (message) => {
    const text = message.content.toLowerCase();
    const emojis = countEmojis(text);
    const emojisArray = Object.getOwnPropertyNames(emojis);
    emojisArray.forEach((emoji) => {
        const num = 1; //emojis[emoji]; - Changed to prevent people being stupid
        database.serialize(() => {
            const statement = database.prepare("INSERT INTO `emojis` (emoji, num) VALUES(?, ?) ON CONFLICT(emoji) DO UPDATE SET `num`=`num`+?")
            statement.run(
                emoji,
                num,
                num
            );
        });
    });
};

const getTopEmojis = (evt) => {
    database.all("SELECT * FROM `emojis` ORDER BY `num` DESC LIMIT 10", [], (err, rows) => {
        if (rows) {
            const embed = new Discord.MessageEmbed();
            embed.setTitle("Top 10 emojis by usage in the server");
            rows.forEach((row) => {
                embed.addField(row.emoji, `Used ${row.num} times`);
            });
            evt.channel.send(embed);
        }
    });
}

module.exports = {
    logEmojis,
    getTopEmojis
}