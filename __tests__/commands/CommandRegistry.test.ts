import {Client, DMChannel, Guild, GuildMember, Message, Permissions, TextChannel, User} from "discord.js";
import {Command} from "../../src/commands/Command";
import {CommandRegistry} from "../../src/commands/CommandRegistry";
describe("Command Registry tests", () => {
    let guild: Guild;
    let member: GuildMember;
    let message: Message;
    let channel: TextChannel;
    let user: User;
    let dmChannel: DMChannel;
    let client: Client;
    const MockCommand = jest.genMockFromModule<Command>("../../src/commands/Command");

    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        guild = new MockDiscord.Guild();
        member = new MockDiscord.GuildMember();
        message = new MockDiscord.Message();
        channel = new MockDiscord.TextChannel();
        user = new MockDiscord.User();
        dmChannel = new MockDiscord.DMChannel();
        client = new Client();

        Object.defineProperty(message, "guild", {
            value: guild
        });
        Object.defineProperty(message, "member", {
            value: member
        });
        message.author = user;
        channel.guild = guild;
        message.channel = channel;
        message.channel.id = "1";
        message.channel.type = "text";
        dmChannel.type = "dm";
        message.content = "-bus    1   2";
        MockCommand.getRequiredPermission = jest.fn().mockReturnValue(Permissions.FLAGS.VIEW_CHANNEL);
    });

    function mockGoodTextCommand() {
        MockCommand.commandType = jest.fn().mockReturnValue("text");
        MockCommand.getCommand = jest.fn().mockReturnValue(["bus"]);
        MockCommand.isCommandEnabled = jest.fn().mockResolvedValue(true);
        MockCommand.getProhibitedChannels = jest.fn().mockResolvedValue([]);
        member.hasPermission = jest.fn().mockReturnValue(true);
        MockCommand.useCommand = jest.fn();
    }

    function mockBadTextCommand() {
        MockCommand.commandType = jest.fn().mockReturnValue("text");
        MockCommand.getCommand = jest.fn().mockReturnValue(["bus"]);
        MockCommand.isCommandEnabled = jest.fn().mockResolvedValue(true);
        MockCommand.getProhibitedChannels = jest.fn().mockResolvedValue([]);
        member.hasPermission = jest.fn().mockReturnValue(false);
        MockCommand.useCommand = jest.fn();
    }

    test("Should return immediately if author is bot", async () => {
        message.author.bot = true;
        MockCommand.getCommand = jest.fn();
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.getCommand).not.toHaveBeenCalled();
    });

    test("should return if command type isn't correct", async () => {
        MockCommand.commandType = jest.fn().mockReturnValue("dm");
        MockCommand.getCommand = jest.fn().mockReturnValue(["bus"]);
        MockCommand.isCommandEnabled = jest.fn();
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.isCommandEnabled).not.toHaveBeenCalled();
    });

    describe("Text command tests", () => {
        test("Text command happy path", async () => {
            mockGoodTextCommand();
            const registry = new CommandRegistry([MockCommand]);
            await registry.runCommands(client, message);
            expect(MockCommand.useCommand).toHaveBeenCalled();
        });

        test("Text command sad path", async () => {
            mockBadTextCommand();
            const registry = new CommandRegistry([MockCommand]);
            await registry.runCommands(client, message);
            expect(MockCommand.useCommand).not.toHaveBeenCalled();
        });
    });

    test("DM Command test", async () => {
        MockCommand.commandType = jest.fn().mockReturnValue("dm");
        message.channel = dmChannel;
        MockCommand.getCommand = jest.fn().mockReturnValue(["bus"]);
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.useCommand).toHaveBeenCalled();
    });

    test("test command registry constructor", () => {
       expect(new CommandRegistry().registry.length).toBeGreaterThan(0);
    });

    afterAll(() => {
        client.destroy();
    })
});