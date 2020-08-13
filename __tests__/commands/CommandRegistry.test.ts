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
    });

    test("Should return immediately if author is bot", async () => {
        message.author.bot = true;
        MockCommand.getCommand = jest.fn();
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.getCommand).not.toHaveBeenCalled();
    });

    test("Should not getCommand if not a text channel", async () => {
        message.channel = dmChannel;
        MockCommand.getCommand = jest.fn();
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.getCommand).not.toHaveBeenCalled();
    });

    test("Should not get is command enabled if not correct command", async () => {
        message.content = "-bus foo";
        MockCommand.getCommand = jest.fn().mockReturnValue("asdf123");
        MockCommand.isCommandEnabled = jest.fn();
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.getCommand).toHaveBeenCalled();
        expect(MockCommand.isCommandEnabled).not.toHaveBeenCalled();
    });

    test("Should not check prohibited channel if not enabled", async () => {
        message.content = "-bus foo";
        MockCommand.getCommand = jest.fn().mockReturnValue("bus");
        MockCommand.getProhibitedChannels = jest.fn();
        MockCommand.isCommandEnabled = jest.fn().mockResolvedValue(false);
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.getCommand).toHaveBeenCalled();
        expect(MockCommand.isCommandEnabled).toHaveBeenCalled();
        expect(MockCommand.getProhibitedChannels).not.toHaveBeenCalled();
    });

    test("Should not check permission if in prohibited channels", async () => {
        message.content = "-bus foo";
        MockCommand.getCommand = jest.fn().mockReturnValue("bus");
        MockCommand.isCommandEnabled = jest.fn().mockResolvedValue(true);
        MockCommand.getProhibitedChannels = jest.fn().mockResolvedValue(["1"]);
        MockCommand.getRequiredPermission = jest.fn();
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.getCommand).toHaveBeenCalled();
        expect(MockCommand.isCommandEnabled).toHaveBeenCalled();
        expect(MockCommand.getProhibitedChannels).toHaveBeenCalled();
        expect(MockCommand.getRequiredPermission).not.toHaveBeenCalled();
    });

    test("Should call useCommand if user has permission", async () => {
        message.content = "-bus    1    3";
        MockCommand.getCommand = jest.fn().mockReturnValue("bus");
        MockCommand.isCommandEnabled = jest.fn().mockResolvedValue(true);
        MockCommand.getProhibitedChannels = jest.fn().mockResolvedValue([]);
        MockCommand.getRequiredPermission = jest.fn().mockReturnValue(Permissions.FLAGS.VIEW_CHANNEL);
        MockCommand.useCommand = jest.fn();
        member.hasPermission = jest.fn().mockReturnValue(true);
        const registry = new CommandRegistry([MockCommand]);
        await registry.runCommands(client, message);
        expect(MockCommand.getCommand).toHaveBeenCalled();
        expect(MockCommand.isCommandEnabled).toHaveBeenCalled();
        expect(MockCommand.getProhibitedChannels).toHaveBeenCalled();
        expect(MockCommand.getRequiredPermission).toHaveBeenCalled();
        expect(MockCommand.useCommand).toHaveBeenCalledWith(client, message, ["1", "3"])
    });

    test("test command registry constructor", () => {
       expect(new CommandRegistry().registry.length).toBeGreaterThan(0);
    });

    afterAll(() => {
        client.destroy();
    })
});