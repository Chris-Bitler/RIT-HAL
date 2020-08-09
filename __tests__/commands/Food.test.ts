import {getOpenPlaces} from "../../src/processors/FoodProcessor";
import {Client, Message, TextChannel} from "discord.js";
import * as sentry from "@sentry/node";
import {Food} from "../../src/commands/Food";

jest.mock("../../src/processors/FoodProcessor");
jest.mock("@sentry/node");
describe("Food command tests", () => {
    let message: Message;
    let client: Client;
    let channel: TextChannel;

    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        message = new MockDiscord.Message();
        channel = new MockDiscord.TextChannel();;
        client = new Client();

        message.channel = channel;
        (getOpenPlaces as jest.MockedFunction<typeof getOpenPlaces>).mockReset();
        (sentry.captureException as jest.MockedFunction<any>).mockReset();
    });

    afterAll(() => {
        client.destroy();
    });

    test("should sentry capture error if occurs", async () => {
        const food = new Food();
        (getOpenPlaces as jest.MockedFunction<typeof getOpenPlaces>).mockRejectedValueOnce("Error");
        await food.useCommand(client, message);
        expect(getOpenPlaces).toHaveBeenCalled();
        expect(sentry.captureException).toHaveBeenCalled();
        expect(channel.send).toHaveBeenCalled();
    });

    test("should send error message if getOpenPlaces returns null", async () => {
        const food = new Food();
        (getOpenPlaces as jest.MockedFunction<typeof getOpenPlaces>).mockResolvedValue(null);
        await food.useCommand(client, message);
        expect(getOpenPlaces).toHaveBeenCalled();
        expect(sentry.captureException).not.toHaveBeenCalled();
        expect(channel.send).toHaveBeenCalled();
    });

    test("should send embed if places retrieved", async () => {
        const food = new Food();
        (getOpenPlaces as jest.MockedFunction<typeof getOpenPlaces>).mockResolvedValue([{
            name: "Test",
            sections: [{
                header: "Test 2",
                times: "1:00 pm"
            }]
        }]);
        await food.useCommand(client, message);
        expect(getOpenPlaces).toHaveBeenCalled();
        expect(sentry.captureException).not.toHaveBeenCalled();
        expect(channel.send).toHaveBeenCalled();
    });

    test("should not send embed if no sections received", async () => {
        const food = new Food();
        (getOpenPlaces as jest.MockedFunction<typeof getOpenPlaces>).mockResolvedValue([{
            name: "Test",
            sections: []
        }]);
        await food.useCommand(client, message);
        expect(getOpenPlaces).toHaveBeenCalled();
        expect(sentry.captureException).not.toHaveBeenCalled();
        expect(channel.send).not.toHaveBeenCalled();
    });

    test("getCommand should return rit food", () => {
        const food = new Food();
        expect(food.getCommand()).toEqual("rit food")
    });

    test("getConfigBase should return config base", () => {
        const food = new Food();
        expect(food.getConfigBase()).toEqual("food");
    });
});