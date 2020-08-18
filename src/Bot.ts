"use strict";
// Fixes bug in sequelize that returns bigint as string
import * as pg from "pg";
pg.defaults.parseInt8 = true;

import { ModProcessor } from "./processors/ModProcessor";
import {
    Client,
    GuildEmoji,
    GuildMember,
    Message, MessageReaction, PartialUser,
    TextChannel, User
} from "discord.js";
import { Sequelize } from "sequelize-typescript";
import * as dotenv from "dotenv";
import * as sentry from "@sentry/node";
import { CommandRegistry } from "./commands/CommandRegistry";
import { EmojiProcessor } from "./processors/EmojiProcessor";
import { checkReactionToDB } from "./processors/EmojiRoleProcessor";
import { BusProcessor } from "./processors/BusProcessor";
import { checkFoodDaily } from "./processors/FoodProcessor";
import { ConfigProperty } from "./models/ConfigProperty";
import { Emoji } from "./models/Emoji";
import { EmojiToRole } from "./models/EmojiToRole";
import { Punishment } from "./models/Punishment";
import { AlarmProcessor } from "./processors/AlarmProcessor";
import { Alarm } from "./models/Alarm";
import {MailConfig} from "./models/MailConfig";
import {SendEmbedStateMachine} from "./stateMachines/SendEmbedStateMachine";
dotenv.config();

const commandRegistry = new CommandRegistry();
const modProcessor = ModProcessor.getInstance();
const alarmProcessor = AlarmProcessor.getInstance();

const client = new Client({
    partials: ["MESSAGE", "CHANNEL", "REACTION"]
});

sentry.init({
    dsn: process.env.sentry_dsn
});

const sequelize: Sequelize = new Sequelize(
    process.env.DATABASE_URL as string,
    {
        dialect: "postgres",
        logging: false,
        models: [ConfigProperty, Emoji, EmojiToRole, Punishment, Alarm, MailConfig]
    });
sequelize.sync();

client.on("message", async (message: Message) => {
    if (!message.partial) {
        const ranCommand = await commandRegistry.runCommands(client, message);
        await EmojiProcessor.getInstance().logEmojis(message);
        if (!ranCommand) {
            SendEmbedStateMachine.getInstance().handleStep(client, message);
        }
    }
});


client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const mutedRoleId = await modProcessor.fetchMutedRoleId(newMember.guild.id);
    if (mutedRoleId) {
        if (
            oldMember.roles.cache.get(mutedRoleId) &&
            !newMember.roles.cache.get(mutedRoleId)
        ) {
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
        await modProcessor.reassignUserMutedRole(guildMember);
    }
});

client.on("guildBanRemove", async (guild, member) => {
    await modProcessor.unbanUser(guild, member.id);
});

const handleEmojiReactions = async (reaction: MessageReaction, user: User | PartialUser) => {
    if (reaction.message.partial) await reaction.message.fetch();
    const channel = reaction.message.channel;
    if (!user.bot && channel instanceof TextChannel) {
        const emoji = reaction.emoji;
        const member = channel.guild.members.resolve(await user.fetch());
        if (member && emoji) {
            await checkReactionToDB(emoji, member, channel, reaction);
        }
    }
}

client.on("messageReactionAdd", handleEmojiReactions);

client.on("messageReactionRemove", handleEmojiReactions);

setTimeout(() => modProcessor.loadPunishmentsFromDB(), 1000);
setInterval(() => modProcessor.tickPunishments(client), 2000);
setTimeout(() => alarmProcessor.loadAlarms(), 1000);
setInterval(() => alarmProcessor.tickAlarms(client), 1000);

client.login(process.env.discord_token);

client.on("ready", async () => {
    await checkFoodDaily(client);
    setInterval(() => checkFoodDaily(client), 10 * 60 * 1000);
});

BusProcessor.getInstance().refreshInformation();

setInterval(
    () => BusProcessor.getInstance().refreshInformation(),
    1000 * 60 * 30
); // 30 minutes
