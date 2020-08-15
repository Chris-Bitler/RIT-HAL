import {MESSAGE_SENT, NO_SERVER, sendMessageToChannel} from "../../src/processors/MailProcessor";
import {Client, DMChannel, Message} from "discord.js";
import {Mail} from "../../src/commands/Mail";
import {getErrorEmbed, getInformationalEmbed} from "../../src/utils/EmbedUtil";

jest.mock("../../src/processors/MailProcessor");

describe("Mail command", () => {
    let client: Client;
    let channel: DMChannel;
    let message: Message;
    let mockSend: jest.MockedFunction<typeof channel.send>;
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        message = new MockDiscord.Message();
        channel = new MockDiscord.DMChannel();
        client = new Client();
        message.channel = channel;
        mockSend = jest.fn();
        message.channel.send = mockSend;
        Date.now = jest.fn().mockReturnValue(1);
    });

    test("Not enough args should send error", async () => {
        const mail = new Mail();
        await mail.useCommand(client, message, []);
        expect(channel.send).toHaveBeenCalledWith(getErrorEmbed(
            "Please specify a server and message to send"
        ));
    });

    test("If server not found should send error", async () => {
        const mail = new Mail();
        (sendMessageToChannel as jest.MockedFunction<typeof sendMessageToChannel>)
            .mockResolvedValue(NO_SERVER);
        await mail.useCommand(client, message, ["fakeServer", "test"]);
        expect(channel.send).toHaveBeenCalledWith(getErrorEmbed(
            "No server with that name was found"
        ));
    });

    test("Send confirmation message if sent", async () => {
        const mail = new Mail();
        (sendMessageToChannel as jest.MockedFunction<typeof sendMessageToChannel>)
            .mockResolvedValue(MESSAGE_SENT);
        await mail.useCommand(client, message, ["fakeServer", "test"]);
        expect(channel.send).toHaveBeenCalledWith(
            getInformationalEmbed(
                "Message sent",
                "Your message was sent to the staff in the fakeServer discord"
            )
        );
    });

    test("command should be set up correctly", () => {
        const mail = new Mail();
        expect(mail.getCommand()).toEqual(["mail"]);
        expect(mail.commandType()).toEqual("dm");
    });
});