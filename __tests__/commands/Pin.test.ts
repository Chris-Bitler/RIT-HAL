import {
    TextChannel,
    Guild,
    GuildChannelManager,
    Message,
    Client,
    VoiceChannel,
    MessageManager,
    GuildMemberManager, GuildMember, User, MessageAttachment, Collection, Snowflake, MessageEmbed
} from "discord.js";
import {getErrorEmbed, getInformationalEmbed} from "../../src/utils/EmbedUtil";
import {Pin} from "../../src/commands/Pin";
import {ConfigProperty} from "../../src/models/ConfigProperty";
import * as sentry from "@sentry/node";

jest.mock("@sentry/node");
describe("Pin command tests", () => {
    let sendingChannel: TextChannel;
    let commandChannel: TextChannel;
    let toChannel: TextChannel;
    let guild: Guild;
    let channelManager: GuildChannelManager;
    let messageManager: MessageManager;
    let guildMemberManager: GuildMemberManager;
    let beingPinned: GuildMember;
    let pinner: GuildMember;
    let messageAuthor: User;
    let voiceChannel: VoiceChannel;
    let message: Message;
    let client: Client;
    let messageAttachment: MessageAttachment;
    let nonImageMessageAttachment: MessageAttachment;
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        sendingChannel = new MockDiscord.TextChannel();
        commandChannel = new MockDiscord.TextChannel();
        toChannel = new MockDiscord.TextChannel();
        voiceChannel = new MockDiscord.VoiceChannel();
        guild = new MockDiscord.Guild();
        channelManager = new MockDiscord.GuildChannelManager();
        messageManager = new MockDiscord.MessageManager();
        guildMemberManager = new MockDiscord.GuildMemberManager();
        beingPinned = new MockDiscord.GuildMember();
        pinner = new MockDiscord.GuildMember();
        message = new MockDiscord.Message();
        messageAuthor = new MockDiscord.User();
        messageAttachment = new MockDiscord.MessageAttachment();
        nonImageMessageAttachment = new MockDiscord.MessageAttachment();
        client = new Client();

        Object.defineProperty(message, "guild", {
            value: guild,
            writable: true
        });
        guild.channels = channelManager;
        message.channel = commandChannel;
        commandChannel.guild = guild;
        commandChannel.type = "text";
        guild.id = "1";
        guild.members = guildMemberManager;
        sendingChannel.messages = messageManager;
        sendingChannel.type = "text";
        toChannel.type = "text";
        Object.defineProperty(pinner, "displayName", {
            value:"Test1"
        });
        Object.defineProperty(beingPinned, "displayName", {
            value: "Test2"
        });
        Date.now = jest.fn().mockReturnValue(1);
    });

    afterAll(() => {
        client.destroy();
    })

    test("No args should send error embed", async () => {
        const pin = new Pin();
        await pin.useCommand(client, message, []);
        expect(commandChannel.send).toHaveBeenCalledWith(
            getErrorEmbed(
                "Incorrect syntax, try `-pin [discord message url]`"
            )
        );
    });

    test("Invalid url should send error embed", async () => {
        const pin = new Pin();
        await pin.useCommand(client, message, ["12346723452"]);
        expect(commandChannel.send).toHaveBeenCalledWith(
            getErrorEmbed("Please use a valid discord message url")
        );
    });

    test("Should sentry capture exception if error occurs", async () => {
        const pin = new Pin();
        ConfigProperty.findOne = jest.fn().mockRejectedValueOnce("Error");

        await pin.useCommand(client, message, ["https://discordapp.com/channels/401908664018927626/535311735083761705/742107844228415619"]);
        expect(commandChannel.send).toHaveBeenCalledWith(
            getErrorEmbed("Error sending embed to starboard channel")
        );
        expect(sentry.captureException).toHaveBeenCalled();
    });

    test("Should send error embed if starboard channel id not set", async () => {
        const pin = new Pin();
        ConfigProperty.findOne = jest.fn().mockResolvedValue(null);

        await pin.useCommand(client, message, ["https://discordapp.com/channels/401908664018927626/535311735083761705/742107844228415619"]);
        expect(commandChannel.send).toHaveBeenCalledWith(
            getErrorEmbed("Please make sure to set the starboard channel id before using this command")
        );
    });

    test("Should send error embed if starboard or original channel are not valid", async () => {
        const pin = new Pin();
        ConfigProperty.findOne = jest.fn().mockResolvedValue({value: "12345"});
        channelManager.resolve = jest.fn().mockReturnValue(voiceChannel);

        await pin.useCommand(client, message, ["https://discordapp.com/channels/401908664018927626/535311735083761705/742107844228415619"]);
        expect(commandChannel.send).toHaveBeenCalledWith(
            getErrorEmbed("Please make sure the starboard channel and the channel the message is in are valid")
        );
    });

    test("Should send error embed if target message doesn't exist", async () => {
        const pin = new Pin();
        ConfigProperty.findOne = jest.fn().mockResolvedValue({value: "12345"});
        channelManager.resolve = jest.fn()
            .mockReturnValueOnce(sendingChannel)
            .mockReturnValueOnce(toChannel);
        messageManager.fetch = jest.fn().mockResolvedValue(null);

        await pin.useCommand(client, message, ["https://discordapp.com/channels/401908664018927626/535311735083761705/742107844228415619"]);
        expect(commandChannel.send).toHaveBeenCalledWith(
            getErrorEmbed("Cannot resolve message to pin")
        );
    });
    test("Should send error embed if poster of target message doesn't exist", async () => {
        const pin = new Pin();
        ConfigProperty.findOne = jest.fn().mockResolvedValue({value: "12345"});
        channelManager.resolve = jest.fn()
            .mockReturnValueOnce(sendingChannel)
            .mockReturnValueOnce(toChannel);
        guildMemberManager.resolve = jest.fn()
            .mockReturnValue(null)
            .mockReturnValue(null)
        messageManager.fetch = jest.fn().mockResolvedValue(message);
        message.author = messageAuthor;

        await pin.useCommand(client, message, ["https://discordapp.com/channels/401908664018927626/535311735083761705/742107844228415619"]);
        expect(commandChannel.send).toHaveBeenCalledWith(
            getErrorEmbed("Cannot resolve member who posted the message to pin")
        );
    });

    test("Should send pinned embed", async () => {
        const pin = new Pin();
        const collection = new Collection<string, MessageAttachment>();
        ConfigProperty.findOne = jest.fn().mockResolvedValue({value: "12345"});
        channelManager.resolve = jest.fn()
            .mockReturnValueOnce(sendingChannel)
            .mockReturnValueOnce(toChannel);
        guildMemberManager.resolve = jest.fn()
            .mockReturnValue(beingPinned)
            .mockReturnValue(pinner);
        messageManager.fetch = jest.fn().mockResolvedValue(message);
        message.author = messageAuthor;
        messageAuthor.displayAvatarURL = jest.fn().mockReturnValue("http://test/12345.png");
        message.content = "Test"
        messageAttachment.name = "test"
        messageAttachment.url = "http://test.com/test.png"
        nonImageMessageAttachment.name = "test2"
        nonImageMessageAttachment.url = "http://test.com/test.mp4";
        collection.set("1", messageAttachment);
        collection.set("2", nonImageMessageAttachment);
        message.attachments = collection;
        const expectedEmbed = new MessageEmbed();
        expectedEmbed.setAuthor("Test1", message.author.displayAvatarURL());
        expectedEmbed.setDescription("Test");
        expectedEmbed.addField("Source", "[Link](https://discordapp.com/channels/401908664018927626/535311735083761705/742107844228415619)")
        expectedEmbed.addField("Pinned by", pinner.displayName);
        expectedEmbed.setImage("http://test.com/test.png");
        expectedEmbed.addField("Attachment", "[test2](http://test.com/test.mp4)");

        await pin.useCommand(client, message, ["https://discordapp.com/channels/401908664018927626/535311735083761705/742107844228415619"]);
        expect(toChannel.send).toHaveBeenCalledWith(expectedEmbed);
        expect(commandChannel.send).toHaveBeenCalledWith(
            getInformationalEmbed(
                "Pinned",
                "Message from Test1 pinned in starboard."
            )
        )
    });
});