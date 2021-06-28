'use strict';
// Fixes bug in sequelize that returns bigint as string
import * as pg from 'pg';
pg.defaults.parseInt8 = true;

import {
    Client,
    GuildMember,
    Intents,
    Message,
    MessageReaction,
    PartialMessage,
    PartialUser,
    TextChannel,
    User,
    WSEventType
} from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import * as dotenv from 'dotenv';
import * as sentry from '@sentry/node';
import { CommandRegistry } from './commands/CommandRegistry';
import { EmojiProcessor } from './processors/EmojiProcessor';
import { checkReactionToDB } from './processors/EmojiRoleProcessor';
import { BusProcessor } from './processors/BusProcessor';
import { checkFoodDaily } from './processors/FoodProcessor';
import { ConfigProperty } from './models/ConfigProperty';
import { Emoji } from './models/Emoji';
import { EmojiToRole } from './models/EmojiToRole';
import { AlarmProcessor } from './processors/AlarmProcessor';
import { Alarm } from './models/Alarm';
import { Alarm as AlarmSlashCommand } from './slashCommands/commands/Alarm';
import { MailConfig } from './models/MailConfig';
import { SendEmbedStateMachine } from './stateMachines/SendEmbedStateMachine';
import { LogProcessor } from './processors/LogProcessor';
import { initCooldowns } from './utils/CooldownUtil';
import { CensorProcessor } from './processors/CensorProcessor';
import { CensorEntry } from './models/CensorEntry';
import { StarboardProcessor } from './processors/StarboardProcessor';
import { StarboardedMessage } from './models/StarboardedMessage';
import { SlashCreator, GatewayServer } from 'slash-create';
import {Weather} from './slashCommands/commands/Weather';
dotenv.config();

const commandRegistry = new CommandRegistry();
const starboardProcessor = new StarboardProcessor();
const alarmProcessor = AlarmProcessor.getInstance();

const client = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    ws: {
        intents: Intents.ALL
    }
});

const creator = new SlashCreator({
    applicationID: process.env.discord_application_id ?? '',
    publicKey: process.env.discord_public_key ?? '',
    token: process.env.discord_token ?? ''
});

(async () => {
    try {
        await creator
            .registerCommand(new AlarmSlashCommand(client, creator))
            .registerCommand(new Weather(client, creator))
            .syncCommands();
    } catch (e) {
        console.error(e);
    }
})();

creator.withServer(
    new GatewayServer((handler) =>
        client.ws.on(<WSEventType>'INTERACTION_CREATE', handler)
    )
);

creator.on('debug', console.log);

sentry.init({
    dsn: process.env.sentry_dsn
});

const sequelize: Sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'postgres',
    logging: false,
    models: [
        ConfigProperty,
        Emoji,
        EmojiToRole,
        Alarm,
        MailConfig,
        CensorEntry,
        StarboardedMessage
    ],
    ssl: true,
    dialectOptions: {
        ssl: {
            require: false,
            rejectUnauthorized: false,
        }
    }
});
sequelize.sync();

client.on('message', async (message: Message) => {
    if (!message.partial) {
        const ranCommand = await commandRegistry.runCommands(client, message);
        // await EmojiProcessor.getInstance().logEmojis(message);
        await CensorProcessor.getInstance().processMessage(message);
        if (!ranCommand) {
            SendEmbedStateMachine.getInstance().handleStep(client, message);
        }
    }
});

client.on('messageDelete', async (message: Message | PartialMessage) => {
    let deletedMessage = message;
    if (message.partial) {
        deletedMessage = await message.fetch();
    }
    await starboardProcessor.handleRemovedMessage(deletedMessage);
});

const handleEmojiReactions = async (
    messageReaction: MessageReaction,
    user: User | PartialUser
) => {
    let reaction = messageReaction;
    if (reaction.count === null) reaction = await reaction.fetch();
    LogProcessor.getLogger().info(
        `Handling emoji reaction for ${user.username} - reaction ${reaction.emoji}`
    );
    if (reaction.message.partial)
        LogProcessor.getLogger().info(
            `Fetching message as it had partial for ${user.username}`
        );
    await reaction.message.fetch();
    const channel = reaction.message.channel;
    LogProcessor.getLogger().info(
        `debug: ${
            channel instanceof TextChannel
        } - is channel text channel and not bot - ${user.bot}`
    );
    if (!user.bot && channel instanceof TextChannel) {
        const emoji = reaction.emoji;
        const member = channel.guild.members.resolve(await user.fetch());
        LogProcessor.getLogger().info(
            `Checking emoji role for ${member?.displayName} for ${emoji}`
        );
        if (member && emoji) {
            await checkReactionToDB(emoji, member, channel);
        }
    }
};

const handleReactionChanges = async (reaction: MessageReaction, user: User | PartialUser) => {
    await handleEmojiReactions(reaction, user);
    const messageChannel = reaction.message.channel;
    if (messageChannel.type === 'text') {
        const serverId = messageChannel.guild.id;
        const starboardChannel = await starboardProcessor.fetchStarboardChannel(serverId);
        if (messageChannel.id !== starboardChannel) {
            await starboardProcessor.respondToStarReaction(await user.fetch(), reaction);
        } else {
            console.log('ignoring starboard due to starring in starboard channel');
        }
    }
};

client.on(
    'messageReactionAdd',
    async (reaction: MessageReaction, user: User | PartialUser) => {
        await handleReactionChanges(reaction, user);
    }
);

client.on(
    'messageReactionRemove',
    async (reaction: MessageReaction, user: User | PartialUser) => {
        await handleReactionChanges(reaction, user);
    }
);

setTimeout(() => alarmProcessor.loadAlarms(), 1000);
setTimeout(() => CensorProcessor.getInstance().loadCensoredWords(), 1000);
setTimeout(() => starboardProcessor.loadStarredMessages(), 1000);
setInterval(() => alarmProcessor.tickAlarms(client), 1000);

client.login(process.env.discord_token);

client.on('ready', async () => {
    await checkFoodDaily(client);
    setInterval(() => checkFoodDaily(client), 10 * 60 * 1000);
});

BusProcessor.getInstance().refreshInformation();

initCooldowns();

setInterval(
    () => BusProcessor.getInstance().refreshInformation(),
    1000 * 60 * 30
); // 30 minutes

process.on('uncaughtException', function (err) {
    // handle the error safely
    LogProcessor.getLogger().error(err);
});
