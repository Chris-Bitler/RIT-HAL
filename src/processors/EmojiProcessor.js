const {database} = require("../Database");
const Discord = require("discord.js");

const ALLOWED_CHANNELS = [
    "401908664018927628",
    "404792701457006602"
];

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
    if (!ALLOWED_CHANNELS.includes(message.channel.id)) {
        return;
    }
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