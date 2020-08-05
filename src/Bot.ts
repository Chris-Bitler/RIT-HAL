"use strict";
import {ModProcessor} from "./processors/ModProcessor";
import {Client, GuildEmoji, GuildMember, Message, TextChannel} from "discord.js";
import {Sequelize} from "sequelize-typescript";
import * as dotenv from "dotenv";
import {CommandRegistry} from "./commands/CommandRegistry";
import {EmojiProcessor} from "./processors/EmojiProcessor";
import {checkReactionToDB} from "./processors/EmojiRoleProcessor";
import {BusProcessor} from "./processors/BusProcessor";
import {checkFoodDaily} from "./processors/FoodProcessor";
import {ConfigProperty} from "./models/ConfigProperty";
import {Emoji} from "./models/Emoji";
import {EmojiToRole} from "./models/EmojiToRole";
import {Punishment} from "./models/Punishment";
dotenv.config();


const commandRegistry = new CommandRegistry();
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
            models: [ConfigProperty, Emoji, EmojiToRole, Punishment]
        }
    );
    sequelize.sync();

} else {
    console.log("Please specify database information");
    process.exit(1);
}

client.on("message", async (message: Message) => {
    if (!message.partial) {
        commandRegistry.runCommands(client, message);
        await EmojiProcessor.getInstance().logEmojis(message);
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
    const channel = reaction.message.channel;
    if (!user.bot && channel instanceof TextChannel) {
        const emoji = reaction.emoji;
        const member = channel.guild.members.resolve(await user.fetch());
        if (member && emoji instanceof GuildEmoji) {
            await checkReactionToDB(emoji, member, channel, reaction);
        }
    }
});

setTimeout(() => modProcessor.loadPunishmentsFromDB(), 1000);
setInterval(() => modProcessor.tickPunishments(client), 2000);

client.login(process.env.discord_token);

client.on("ready", async () => {
    await checkFoodDaily(client);
    setInterval(() => checkFoodDaily(client), 10*60*1000);
});

BusProcessor.getInstance().refreshInformation();

setInterval(() => BusProcessor.getInstance().refreshInformation(), 1000*60*30); // 30 minutes