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

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("bot");

function createTables() {
    db.run("CREATE TABLE IF NOT EXISTS `punishments` (id INTEGER AUTO_INCREMENT PRIMARY KEY, userId TEXT, userName TEXT, punisherId TEXT, punisherName TEXT, type TEXT, reason TEXT, expiration INTEGER, active INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS `emojitorole` (id INTEGER AUTO_INCREMENT PRIMARY KEY, emojiId TEXT, roleId TEXT, channelId TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS `emojis` (emoji TEXT PRIMARY KEY, num INTEGER)");
}

function close() {
    db.close();
}

module.exports = {
    createTables,
    close,
    database: db
}