import { EmojiTop } from "../../src/commands/EmojiTop";
import { Client } from "discord.js";
import { EmojiProcessor } from "../../src/processors/EmojiProcessor";
describe("EmojiTop tests", () => {
  test("test useCommand", async () => {
    const MockDiscord = jest.genMockFromModule<any>("discord.js");
    const client = new Client();
    const message = new MockDiscord.Message();
    const emojiProcessor = EmojiProcessor.getInstance();
    emojiProcessor.getTopEmojis = jest.fn();
    const mockGetTopEmoji = emojiProcessor.getTopEmojis as jest.MockedFunction<
      typeof emojiProcessor.getTopEmojis
    >;
    await new EmojiTop().useCommand(client, message);
    expect(mockGetTopEmoji).toHaveBeenCalledWith(message);
    client.destroy();
  });

  test("test getCommand", () => {
    expect(new EmojiTop().getCommand()).toEqual("emojitop");
  });

  test("test getConfigBase", () => {
    expect(new EmojiTop().getConfigBase()).toEqual("emojitop");
  });
});
