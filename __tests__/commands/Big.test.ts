import { Big } from "../../src/commands/Big";
import { getEmojiExtension } from "../../src/utils/EmojiUtil";
import { Client, Message, TextChannel } from "discord.js";
import {getErrorEmbed} from "../../src/utils/EmbedUtil";
jest.mock("../../src/utils/EmojiUtil");
describe("Big command  tests", () => {
    let channel: TextChannel;
    let message: Message;
    const client: Client = new Client();
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        channel = new MockDiscord.TextChannel();
        message = new MockDiscord.Message();
        message.channel = channel;
        Date.now = jest.fn();
        (Date.now as jest.MockedFunction<typeof Date.now>).mockReturnValue(1);
    });
    afterAll(() => {
        //normal cleanup things
        client.destroy();
    });
    test("No arguments should send message about needing emoji", async () => {
        const big = new Big();
        const args: string[] = [];
        await big.useCommand(client, message, args);
        expect(channel.send).toHaveBeenCalledWith(
            getErrorEmbed("Please use an emoji to embiggen")
        );
    });
    test("should send no emoji detected if first arg is not an emoji", async () => {
        const big = new Big();
        const args: string[] = ["blah blah blah"];
        await big.useCommand(client, message, args);
        expect(channel.send).toHaveBeenCalledWith(getErrorEmbed("No valid emoji detected"));
    });
    test("should send attachment if is valid emoji", async () => {
        const mockGetEmojiExtension = getEmojiExtension as jest.MockedFunction<
            typeof getEmojiExtension
        >;
        mockGetEmojiExtension.mockResolvedValue("http://test.com/12345.gif");
        const sendMock = channel.send as jest.Mock;

        const big = new Big();
        await big.useCommand(client, message, ["<:12345:>"]);

        expect(sendMock.mock.calls[0][0].attachment).toEqual(
            "http://test.com/12345.gif"
        );
    });
    test("should send no valid emoji detected if error thrown getting url", async () => {
        const mockGetEmojiExtension = getEmojiExtension as jest.MockedFunction<
            typeof getEmojiExtension
        >;
        mockGetEmojiExtension.mockRejectedValue("test");

        const big = new Big();
        await big.useCommand(client, message, ["<:12345:>"]);
        expect(channel.send).toHaveBeenCalledWith(getErrorEmbed("No valid emoji detected"));
    });
    test("command label returns expected", () => {
        const big = new Big();
        expect(big.getCommand()).toEqual("big");
    });
});
