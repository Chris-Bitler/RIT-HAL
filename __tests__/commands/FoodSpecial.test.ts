import {getSpecials, getSpecialsEmbed} from "../../src/processors/FoodProcessor";
import {Client, Message, TextChannel} from "discord.js";
import {FoodSpecials} from "../../src/commands/FoodSpecials";
jest.mock("../../src/processors/FoodProcessor");

describe("Food Specials tests", () => {
    let client: Client;
    let message: Message;
    let channel: TextChannel;
    let mockGetSpecials: jest.MockedFunction<typeof getSpecials>;
    let mockGetSpecialsEmbed: jest.MockedFunction<typeof getSpecialsEmbed>;

    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        client = new Client();
        message = new MockDiscord.Message();
        channel = new MockDiscord.TextChannel();
        message.channel = channel;

        mockGetSpecials = (getSpecials as jest.MockedFunction<typeof getSpecials>);
        mockGetSpecialsEmbed = (getSpecialsEmbed as jest.MockedFunction<typeof getSpecialsEmbed>);
        mockGetSpecials.mockReset();
        mockGetSpecialsEmbed.mockReset();
    });

    test("No place menus should not call getSpecialsEmbed", async () => {
        const foodSpecials = new FoodSpecials();
        mockGetSpecials.mockResolvedValue([]);
        await foodSpecials.useCommand(client, message);

        expect(mockGetSpecialsEmbed).not.toHaveBeenCalled();
    });

    test("Should call getSpecialsEmbed if breakfast exists", async () => {
        const foodSpecials = new FoodSpecials();
        mockGetSpecials.mockResolvedValue([{
            name: "test",
            breakfast: [{
                category: "Test",
                items: []
            }]
        }]);
        await foodSpecials.useCommand(client, message);

        expect(mockGetSpecialsEmbed).toHaveBeenCalled();
        expect(channel.send).toHaveBeenCalled();
    });

    test("Should call getSpecialsEmbed if lunch exists", async () => {
        const foodSpecials = new FoodSpecials();
        mockGetSpecials.mockResolvedValue([{
            name: "test",
            lunch: [{
                category: "Test",
                items: []
            }]
        }]);
        await foodSpecials.useCommand(client, message);

        expect(mockGetSpecialsEmbed).toHaveBeenCalled();
        expect(channel.send).toHaveBeenCalled();
    });

    test("Should call getSpecialsEmbed if dinner exists", async () => {
        const foodSpecials = new FoodSpecials();
        mockGetSpecials.mockResolvedValue([{
            name: "test",
            dinner: [{
                category: "Test",
                items: []
            }]
        }]);
        await foodSpecials.useCommand(client, message);

        expect(mockGetSpecialsEmbed).toHaveBeenCalled();
        expect(channel.send).toHaveBeenCalled();
    });

    test("Should call getSpecialsEmbed none of the three meals exist", async () => {
        const foodSpecials = new FoodSpecials();
        mockGetSpecials.mockResolvedValue([{
            name: "test"
        }]);
        await foodSpecials.useCommand(client, message);

        expect(mockGetSpecialsEmbed).not.toHaveBeenCalled();
        expect(channel.send).not.toHaveBeenCalled();
    });

    test("getCommand should return rit specials", () => {
        expect(new FoodSpecials().getCommand()).toEqual("rit specials")
    });

    test("getConfigBase should return specials", () => {
        expect(new FoodSpecials().getConfigBase()).toEqual("specials");
    });

    afterAll(() => {
        client.destroy();
    })
});