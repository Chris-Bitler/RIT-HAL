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