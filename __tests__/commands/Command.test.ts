import {Command} from "../../src/commands/Command";
import {Client, Message, Permissions} from "discord.js";
import {ConfigProperty} from "../../src/models/ConfigProperty";

describe("Command tests", () => {
    const client: Client = new Client();
    let message: Message;
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        message = new MockDiscord.Message();
    });
    afterAll(() => {
        client.destroy();
    })
    test("useCommand in Command should throw error saying to override it", async () => {
        const command = new Command();
        try {
            await command.useCommand(client, message, []);
        } catch (error) {
            expect(error).not.toBeNull();
        }
    });
    test("getCommand in Command should throw error saying to override it", async () => {
        const command = new Command();
        try {
            await command.getCommand();
        } catch (error) {
            expect(error).not.toBeNull();
        }
    });
    test("useCommand in Command should throw error saying to override it", () => {
        const command = new Command();
        expect(command.getRequiredPermission()).toEqual(Permissions.FLAGS.VIEW_CHANNEL);
    });

    describe("test getProhibitedChannels", () => {
        test("Should return prohibited channels", async () => {
            ConfigProperty.findOne = jest.fn().mockReturnValue({
                value: "[\"1\"]"
            });
            const command = new Command();
            const channels: string[] = await command.getProhibitedChannels("1");
            expect(channels).toEqual(["1"]);
            expect(ConfigProperty.findOne).toHaveBeenCalledWith({
                where: {
                    key: "base.prohibited",
                    serverId: "1"
                }
            });
        });
        test("Should return empty array if no result from findOne", async () => {
            ConfigProperty.findOne = jest.fn().mockReturnValue(null);
            const command = new Command();
            const channels: string[] = await command.getProhibitedChannels("1");
            expect(channels).toEqual([]);
            expect(ConfigProperty.findOne).toHaveBeenCalledWith({
                where: {
                    key: "base.prohibited",
                    serverId: "1"
                }
            });
        });
    });
});