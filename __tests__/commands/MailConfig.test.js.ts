import {Client, TextChannel, Message, Guild, Permissions} from "discord.js";
import {MailConfig} from "../../src/commands/MailConfig";
import {getErrorEmbed, getInformationalEmbed} from "../../src/utils/EmbedUtil";
import {CONFIG_SET, NAME_TAKEN_ERR, setMailConfig} from "../../src/processors/MailProcessor";

jest.mock("../../src/processors/MailProcessor");

describe("MailConfig commands", () => {
    let client: Client;
    let channel: TextChannel;
    let message: Message;
    let guild: Guild;
    let mockSend: jest.MockedFunction<typeof channel.send>;

    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        client = new Client();
        channel = new MockDiscord.TextChannel();
        message = new MockDiscord.Message();
        guild = new MockDiscord.Guild();
        mockSend = jest.fn();
        channel.send = mockSend;
        message.channel = channel;
        Object.defineProperty(message, "guild", {
            value: guild,
            writable: true
        });
        guild.id = "12345";
        Date.now = jest.fn().mockReturnValue(1);
    });

    afterAll(() => {
        client.destroy();
    })

    test("Should send error if serverName isn't defined", async () => {
        const mailConfig = new MailConfig();
        await mailConfig.useCommand(client, message, []);
        expect(channel.send).toHaveBeenCalledWith(
            getErrorEmbed("Incorrect syntax. Try -mailconfig [serverName] [admin channel]")
        );
    });

    test("Should send error if channel isn't defined", async () => {
        const mailConfig = new MailConfig();
        await mailConfig.useCommand(client, message, ["server"]);
        expect(channel.send).toHaveBeenCalledWith(
            getErrorEmbed("Incorrect syntax. Try -mailconfig [serverName] [admin channel]")
        );
    });

    test("Should send error if serverId isn't defined", async () => {
        const mailConfig = new MailConfig();
        Object.defineProperty(message, "guild", {
            value: null
        });
        await mailConfig.useCommand(client, message, ["server", "channel"]);
        expect(channel.send).toHaveBeenCalledWith(
            getErrorEmbed("Incorrect syntax. Try -mailconfig [serverName] [admin channel]")
        );
    });

    test("if server name taken, should send error", async () => {
        (setMailConfig as jest.MockedFunction<typeof setMailConfig>)
            .mockResolvedValue(NAME_TAKEN_ERR);
        const mailConfig = new MailConfig();
        await mailConfig.useCommand(client, message, ["server", "channel"]);
        expect(channel.send).toHaveBeenCalledWith(
            getErrorEmbed("That server name is already taken. Try a different one")
        );
    });

    test("if config set, should inform user", async () => {
        (setMailConfig as jest.MockedFunction<typeof setMailConfig>)
            .mockResolvedValue(CONFIG_SET);
        const mailConfig = new MailConfig();
        await mailConfig.useCommand(client, message, ["server", "channel"]);
        expect(channel.send).toHaveBeenCalledWith(
            getInformationalEmbed(
                "Mail config updated",
                `Server admin mail configuration updated`
            )
        );
    });

    test("Should be set up correctly", () => {
        const mailConfig = new MailConfig();
        expect(mailConfig.getCommand()).toEqual(["mconfig"]);
        expect(mailConfig.getConfigBase()).toEqual("mailconfig");
        expect(mailConfig.getRequiredPermission()).toEqual(Permissions.FLAGS.ADMINISTRATOR);
    });
});