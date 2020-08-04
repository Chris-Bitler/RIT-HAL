"use strict";
import {ModProcessor} from "./processors/ModProcessor";

require("dotenv").config();

import {Client, DMChannel, GuildMember, Message} from "discord.js";
import {Sequelize} from "sequelize-typescript";
const CommandRegistryImpl = require("./commands/CommandRegistry");
const CommandRegistry = new CommandRegistryImpl();
const EmojiRoleProcessor = require("./processors/EmojiRoleProcessor");
const EmojiProcessor = require("./processors/EmojiProcessor");
const BusProcessor = require("./processors/BusProcessor");
const FoodProcessor = require("./processors/FoodProcessor");
const modProcessor = ModProcessor.getInstance();
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

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const mutedRoleId = await modProcessor.fetchMutedRoleId(newMember.guild.id);
    if (mutedRoleId) {
        if (oldMember.roles.cache.get(mutedRoleId) && !newMember.roles.cache.get(mutedRoleId)) {
            await modProcessor.unmuteUser(newMember.guild, newMember.id);
        }
    }
});

client.on("guildMemberAdd", async (member) => {
    let guildMember: GuildMember;
    if (member.partial) {
        guildMember = await member.fetch();
    } else {
        guildMember = member;
    }
    if (modProcessor.isUserMuted(guildMember)) {
        await modProcessor.reassignUserMutedRole(guildMember)
    }
});

client.on("guildBanRemove", async (guild, member) => {
    await modProcessor.unbanUser(guild, member.id);
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

modProcessor.loadPunishmentsFromDB();
setInterval(() => modProcessor.tickPunishments(client), 1000);

client.login(process.env.discord_token).then(() => {});

client.on("ready", () => {
    FoodProcessor.checkFoodDaily(client);
    setInterval(() => FoodProcessor.checkFoodDaily(client), 60*1000);
});

BusProcessor.refreshInformation();

setInterval(() => BusProcessor.refreshInformation(), 1000*60*30); // 30 minutes