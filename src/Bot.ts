"use strict";
require("dotenv").config();

import {Client, DMChannel, Message} from "discord.js";
import {Sequelize} from "sequelize-typescript";
const CommandRegistryImpl = require("./commands/CommandRegistry");
const CommandRegistry = new CommandRegistryImpl();
const ModProcessor = require("./processors/ModProcessor");
const EmojiRoleProcessor = require("./processors/EmojiRoleProcessor");
const EmojiProcessor = require("./processors/EmojiProcessor");
const BusProcessor = require("./processors/BusProcessor");
const FoodProcessor = require("./processors/FoodProcessor");
const client = new Client(
    {
        partials: ["MESSAGE", "CHANNEL", "REACTION"]
    }
);

const {postgre_db, postgre_username, postgre_password, postgre_host} = process.env;
if (postgre_db && postgre_username && postgre_password && postgre_host) {
    const sequelize: Sequelize = new Sequelize(
        postgre_db,
        postgre_username,
        postgre_password,
        {
            host: postgre_host,
            dialect: "postgres",
            models: [__dirname + "/models"]
        }
    );
    sequelize.sync();

} else {
    console.log("Please specify database information");
    process.exit(1);
}

client.on("message", (message: Message) => {
    if (!message.partial) {
        CommandRegistry.runCommands(client, message);
        EmojiProcessor.logEmojis(message);
    }
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
    if (oldMember.roles.cache.get(ModProcessor.MUTED_ID) && !newMember.roles.cache.get(ModProcessor.MUTED_ID)) {
        ModProcessor.unmuteUser(newMember);
    }
});

client.on("guildMemberAdd", (member) => {
    if (ModProcessor.isUserMuted(member)) {
        ModProcessor.reassignUserMutedRole(member)
    }
});

client.on("guildBanRemove", (guild, member) => {
    ModProcessor.unbanUser(guild, member.id);
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.message.partial) await reaction.message.fetch();
    let channel = reaction.message.channel;
    if (!user.bot && !(channel instanceof DMChannel)) {
        const emoji = reaction.emoji;
        const member = channel.guild.members.resolve(await user.fetch());
        if (member) {
            EmojiRoleProcessor.checkReactionToDB(emoji, member, channel, reaction);
        }
    }
});

ModProcessor.loadPunishmentsFromDB();
setInterval(() => ModProcessor.tickPunishments(client), 1000);

client.login(process.env.discord_token).then(() => {});

client.on("ready", () => {
    FoodProcessor.checkFoodDaily(client);
    setInterval(() => FoodProcessor.checkFoodDaily(client), 60*1000);
});

BusProcessor.refreshInformation();

setInterval(() => BusProcessor.refreshInformation(), 1000*60*30); // 30 minutes