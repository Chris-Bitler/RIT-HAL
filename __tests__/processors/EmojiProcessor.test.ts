import {
    DMChannel,
    Guild,
    Message,
    MessageEmbed,
    TextChannel
} from "discord.js";
import { ConfigProperty } from "../../src/models/ConfigProperty";
import { Emoji } from "../../src/models/Emoji";
import { EmojiProcessor } from "../../src/processors/EmojiProcessor";

describe("EmojiProcessor tests", () => {
    let message: Message;
    let textChannel: TextChannel;
    let guild: Guild;
    let mockUpdate: jest.MockedFunction<any>;
    let mockSend: jest.MockedFunction<typeof textChannel.send>;
    let dmChannel: DMChannel;
    beforeEach(() => {
        delete EmojiProcessor.instance;
        mockUpdate = jest.fn();
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        message = new MockDiscord.Message();
        textChannel = new MockDiscord.TextChannel();
        dmChannel = new MockDiscord.DMChannel();
        guild = new MockDiscord.Guild();
        guild.id = "1";
        textChannel.guild = guild;
        message.channel = textChannel;
        message.content = "<:test:12345> <:test:12345> <:test11:123455>";
        textChannel.id = "1";
        ConfigProperty.findOne = jest.fn().mockResolvedValue({
            value: '["1"]'
        });
        Emoji.findOrCreate = jest.fn().mockResolvedValue([
            {
                emoji: "test",
                num: 5,
                update: mockUpdate
            },
            false
        ]);
        mockSend = textChannel.send as jest.MockedFunction<
            typeof textChannel.send
        >;
    });

    describe("logEmojis tests", () => {
        test("logEmojis should count and log emojis to database - existing", async () => {
            const emojiProcessor = EmojiProcessor.getInstance();
            await emojiProcessor.logEmojis(message);
            expect(mockUpdate).toHaveBeenCalledWith(
                {
                    num: 6
                },
                {
                    where: {
                        emoji: "test",
                        serverId: "1"
                    }
                }
            );
        });

        test("logEmojis should count and log emojis to database - create", async () => {
            Emoji.findOrCreate = jest.fn().mockResolvedValue([
                {
                    emoji: "test",
                    num: 1,
                    update: mockUpdate
                },
                true
            ]);

            const emojiProcessor = EmojiProcessor.getInstance();
            await emojiProcessor.logEmojis(message);
            expect(mockUpdate).not.toHaveBeenCalled();
        });

        test("Not text channel, shouldn't do anything", async () => {
            Emoji.findOrCreate = jest.fn();

            message.channel = dmChannel;
            const emojiProcessor = EmojiProcessor.getInstance();
            await emojiProcessor.logEmojis(message);
            expect(Emoji.findOrCreate).not.toHaveBeenCalled();
        });

        test("Not allowed channel, should do nothing", async () => {
            ConfigProperty.findOne = jest.fn().mockResolvedValue({
                value: "[]"
            });
            const emojiProcessor = EmojiProcessor.getInstance();
            await emojiProcessor.logEmojis(message);
            expect(Emoji.findOrCreate).not.toHaveBeenCalled();
        });
    });

    describe("getTopEmojis", () => {
        test("getTopEmojis should return embed with top emojis", async () => {
            Emoji.findAll = jest.fn().mockResolvedValue([
                {
                    serverId: "1",
                    emoji: ":test:",
                    num: 5
                },
                {
                    serverId: "1",
                    emoji: ":test2:",
                    num: 7
                }
            ]);

            const emojiProcessor = EmojiProcessor.getInstance();
            await emojiProcessor.getTopEmojis(message);
            const embed: MessageEmbed = mockSend.mock
                .calls[0][0] as MessageEmbed;
            expect(embed.title).toEqual("Top 10 emojis by usage in the server");
            expect(embed.fields[0].name).toEqual(":test:");
            expect(embed.fields[0].value).toEqual("Used 5 times");
            expect(embed.fields[1].name).toEqual(":test2:");
            expect(embed.fields[1].value).toEqual("Used 7 times");
        });
        test("getTopEmojis should return embed with top emojis", async () => {
            Emoji.findAll = jest.fn();
            message.channel = dmChannel;

            const emojiProcessor = EmojiProcessor.getInstance();
            await emojiProcessor.getTopEmojis(message);
            expect(mockSend).not.toHaveBeenCalled();
        });
    });
});
