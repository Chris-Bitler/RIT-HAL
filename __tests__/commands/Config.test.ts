import {Client, Message, Guild, TextChannel, Permissions} from "discord.js";
import {ConfigProperty} from "../../src/models/ConfigProperty";
import {Config} from "../../src/commands/Config";
import {getErrorEmbed, getInformationalEmbed} from "../../src/utils/EmbedUtil";

describe("Config command tests", () => {
    let client: Client;
    let message: Message;
    let guild: Guild;
    let channel: TextChannel;
    let findOrCreateMock: jest.MockedFunction<typeof ConfigProperty.findOrCreate>;
    let updateMock: jest.MockedFunction<typeof ConfigProperty.update>;
    let mockSend: jest.MockedFunction<typeof channel.send>
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        client = new Client();
        message = new MockDiscord.Message();
        guild = new MockDiscord.Guild();
        channel = new MockDiscord.TextChannel();

        guild.id = "1";
        message.channel = channel;
        Object.defineProperty(message, "guild", {
            value: guild,
            writable: true
        });
        findOrCreateMock = jest.fn();
        updateMock = jest.fn();
        mockSend = jest.fn();
        ConfigProperty.findOrCreate = findOrCreateMock;
        ConfigProperty.update = updateMock;
        channel.send = mockSend;
        Date.now = jest.fn().mockReturnValue(1);
    });

    afterAll(() => {
        client.destroy();
    });

    test("Not enough arguments should return error", async () => {
        const config = new Config();
        await config.useCommand(client, message, []);
        expect(mockSend).toHaveBeenCalledWith(getErrorEmbed("Not enough arguments. Try `-config [key] [value]`"));
    });

    test("Can't resolve guild should return error", async () => {
        Object.defineProperty(message, "guild", {
            value: null
        });
        const config = new Config();
        await config.useCommand(client, message, ["key", "value"]);
        expect(mockSend).toHaveBeenCalledWith(getErrorEmbed("Cannot resolve server to set config for"));
    });

    test("Should create if doesn't exist", async () => {
        const config = new Config();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        findOrCreateMock.mockResolvedValue([{key: "key", value: "value"}, true]);
        await config.useCommand(client, message, ["key", "value"]);
        expect(findOrCreateMock).toHaveBeenCalledWith({
            where: {
                serverId: "1",
                key: "key"
            },
            defaults: {
                serverId: "1",
                key: "key",
                value: "value"
            }
        });
        expect(mockSend).toHaveBeenCalledWith(getInformationalEmbed(
            "Value created",
            "key was created and set to value"
        ));
    });

    test("Should update if does exist", async () => {
        const config = new Config();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        findOrCreateMock.mockResolvedValue([{key: "key", value: "value"}, false]);
        await config.useCommand(client, message, ["key", "value"]);
        expect(findOrCreateMock).toHaveBeenCalledWith({
            where: {
                serverId: "1",
                key: "key"
            },
            defaults: {
                serverId: "1",
                key: "key",
                value: "value"
            }
        });
        expect(updateMock).toHaveBeenCalledWith({
            value: "value"
        }, {
            where: {
                serverId: "1",
                key: "key"
            }
        });
        expect(mockSend).toHaveBeenCalledWith(getInformationalEmbed(
            "Value updated",
            "key was updated to value"
        ));
    });

    test("getCommand to return command name", () => {
        const config = new Config();
        expect(config.getCommand()).toEqual("config");
    });
    test("getConfigBase to return command name", () => {
        const config = new Config();
        expect(config.getConfigBase()).toEqual("config");
    });
    test("getPermission to return administrator", () => {
        const config = new Config();
        expect(config.getRequiredPermission()).toEqual(Permissions.FLAGS.ADMINISTRATOR);
    });
});