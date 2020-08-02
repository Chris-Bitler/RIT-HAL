import {EmojiTop} from "../../src/commands/EmojiTop";
import {getTopEmojis} from "../../src/processors/EmojiProcessor";
import {Client} from "discord.js";
jest.mock("../../src/processors/EmojiProcessor");
describe("EmojiTop tests", () => {
    test("test useCommand", async () => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        const client = new Client();
        const message = new MockDiscord.Message();
        const mockGetTopEmoji = getTopEmojis as jest.MockedFunction<typeof getTopEmojis>;
        await new EmojiTop().useCommand(client, message);
        expect(mockGetTopEmoji).toHaveBeenCalledWith(message);
        client.destroy();
    });

    test("test getCommand", () => {
        expect(new EmojiTop().getCommand()).toEqual("emojitop");
    });

    test("test getConfigBase", () => {
        expect(new EmojiTop().getConfigBase()).toEqual("emojitop");
    })
});