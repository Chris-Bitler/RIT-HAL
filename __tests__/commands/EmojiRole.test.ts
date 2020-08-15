import {
    Client,
    TextChannel,
    Message,
    Guild, Role, GuildEmoji, Permissions,
} from "discord.js";
import {getChannel, getRole, addEmojiRole} from "../../src/processors/EmojiRoleProcessor";
import {EmojiRole} from "../../src/commands/EmojiRole";
import {getErrorEmbed} from "../../src/utils/EmbedUtil";
import {getEmoji} from "../../src/utils/EmojiUtil";

jest.mock("../../src/processors/EmojiRoleProcessor");
jest.mock("../../src/utils/EmojiUtil");

describe("EmojiRole command tests", () => {
    let client: Client;
    let channel: TextChannel;
    let targetChannel: TextChannel;
    let message: Message;
    let guild: Guild;
    let role: Role;
    let emoji: GuildEmoji;
    let mockSend: jest.MockedFunction<typeof channel.send>;
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        message = new MockDiscord.Message();
        channel = new MockDiscord.TextChannel();
        targetChannel = new MockDiscord.TextChannel();
        role = new MockDiscord.Role();
        emoji = new MockDiscord.GuildEmoji();
        client = new Client();

        message.channel = channel;
        mockSend = jest.fn();
        message.channel.send = mockSend;
        channel.guild = guild;
        channel.type = "text";
        targetChannel.type = "text";

        jest.resetAllMocks();

        Date.now = jest.fn().mockReturnValue(1);
        (getRole as jest.MockedFunction<typeof getRole>)
            .mockReturnValue(role);
        (getEmoji as jest.MockedFunction<typeof getEmoji>)
            .mockReturnValue(emoji);
        (getChannel as jest.MockedFunction<typeof getChannel>)
            .mockReturnValue(targetChannel);
    });

    afterAll(() => {
        client.destroy();
    });

    describe("useCommand tests", () => {
        test("Not enough args should send error", async () => {
            const emojiRole = new EmojiRole();
            await emojiRole.useCommand(client, message, []);
            expect(channel.send).toHaveBeenCalledWith(
                getErrorEmbed(
                    "Incorrect syntax. Try -emojirole [emoji] [role] [channel]"
                )
            );
        });
        //<a:test:1234567>
        test("should send error if emoji is null", async () => {
            const emojiRole = new EmojiRole();
            (getRole as jest.MockedFunction<typeof getRole>)
                .mockReturnValue(role);
            (getChannel as jest.MockedFunction<typeof getChannel>)
                .mockReturnValue(targetChannel);
            await emojiRole.useCommand(client, message, ["fakeEmoji", "2", "3"]);
            expect(channel.send).toHaveBeenCalledWith(
                getErrorEmbed(
                    "No valid emoji found. Try again."
                )
            );
        });

        test("should send error if channel is undefined", async () => {
            const emojiRole = new EmojiRole();
            (getChannel as jest.MockedFunction<typeof getChannel>)
                .mockReturnValue(undefined);
            await emojiRole.useCommand(client, message, ["<a:test:1234567>", "2", "3"]);
            expect(channel.send).toHaveBeenCalledWith(
                getErrorEmbed(
                    "Invalid channel. Try again."
                )
            );
        });

        test("should send error if role is undefined", async () => {
            const emojiRole = new EmojiRole();
            (getRole as jest.MockedFunction<typeof getRole>)
                .mockReturnValue(undefined);
            await emojiRole.useCommand(client, message, ["<a:test:1234567>", "2", "3"]);
            expect(channel.send).toHaveBeenCalledWith(
                getErrorEmbed(
                    "Invalid role. Try again."
                )
            );
        });

        test("happy path - guild emoji", async () => {
            const emojiRole = new EmojiRole();
            await emojiRole.useCommand(client, message, ["<a:test:1234567>", "2", "3"]);
            expect(addEmojiRole).toHaveBeenCalledWith(channel, emoji, role, targetChannel);
        });
    });

    test("command should be setup", () => {
        const emojiRole = new EmojiRole();
        expect(emojiRole.getCommand()).toEqual(["emojirole"]);
        expect(emojiRole.getRequiredPermission()).toEqual(Permissions.FLAGS.ADMINISTRATOR);
    });
})