import axios from "axios";
import { when } from "jest-when";
import { getEmojiExtension } from "../../src/utils/EmojiUtil";
describe("Emoji Util tests", () => {
    const mockGet = axios.get as jest.MockedFunction<typeof axios.get>;
    beforeEach(() => {
        mockGet.mockReset();
    });
    test("should return gif if gif doesn't error", async () => {
        mockGet.mockResolvedValue(true);
        const value = await getEmojiExtension("1234");
        expect(value).toEqual("https://cdn.discordapp.com/emojis/1234.gif");
    });
    test("should return png if gif errors and png doesn't", async () => {
        when(mockGet)
            .calledWith("https://cdn.discordapp.com/emojis/1234.gif")
            .mockRejectedValue(false);
        when(mockGet)
            .calledWith("https://cdn.discordapp.com/emojis/1234.png")
            .mockResolvedValue(true);
        const value = await getEmojiExtension("1234");
        expect(value).toEqual("https://cdn.discordapp.com/emojis/1234.png");
    });
    test("should reject if gif errors and png also does", async () => {
        when(mockGet)
            .calledWith("https://cdn.discordapp.com/emojis/1234.gif")
            .mockRejectedValue(false);
        when(mockGet)
            .calledWith("https://cdn.discordapp.com/emojis/1234.png")
            .mockRejectedValue(false);
        try {
            await getEmojiExtension("1234");
        } catch (error) {
            expect(error).not.toBeNull();
        }
    });
});
