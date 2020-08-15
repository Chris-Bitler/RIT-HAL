import {Client, Message, Guild, TextChannel, GuildChannelManager, VoiceChannel, Permissions} from "discord.js";
import {AlarmProcessor} from "../../src/processors/AlarmProcessor";
import {Alarm} from "../../src/commands/Alarm";
import {getErrorEmbed} from "../../src/utils/EmbedUtil";

jest.mock("../../src/processors/AlarmProcessor");
describe("Alarm command tests", () => {
    let client: Client;
    let message: Message;
    let channel: TextChannel;
    let channelManager: GuildChannelManager;
    let voiceChannel: VoiceChannel;
    let guild: Guild;
    let alarmProcessor: AlarmProcessor;
    beforeEach(() => {
        delete AlarmProcessor.instance;
        alarmProcessor = new AlarmProcessor();
        AlarmProcessor.getInstance = jest.fn().mockReturnValue(alarmProcessor);
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        client = new Client();
        message = new MockDiscord.Message();
        channelManager = new MockDiscord.GuildChannelManager();
        channel = new MockDiscord.TextChannel();
        voiceChannel = new MockDiscord.VoiceChannel();
        guild = new MockDiscord.Guild();

        Object.defineProperty(message, "guild", {
            value: guild,
            writable: true
        });
        message.channel = channel;
        channel.type = "text";
        Date.now = jest.fn().mockReturnValue(1);
        guild.channels = channelManager;
    });

    describe("Create alarm tests", () => {
        test("Should send error embed if less than 5 args", async () => {
            const alarm = new Alarm();
            await alarm.useCommand(client, message, ["create"]);
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed(
                "Incorrect syntax. Try `-alarm create [channel] [time in Hours:Minutes] [am or pm] [message]`"
            ));
        });

        test("Should send error embed if invalid time - non-numeric", async () => {
            const alarm = new Alarm();
            await alarm.useCommand(client, message, ["create", "1234567", "a:a", "am", "Test 123"]);
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed(
                "Invalid time. Make sure that it is in the form hours:minutes [am|pm]" +
                " and that the hours are 12 or less and the minutes are less than 60"
            ));
        });

        test("Should send error embed if invalid time - not valid timestamp", async () => {
            const alarm = new Alarm();
            await alarm.useCommand(client, message, ["create", "1234567", "14:69", "am", "Test 123"]);
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed(
                "Invalid time. Make sure that it is in the form hours:minutes [am|pm]" +
                " and that the hours are 12 or less and the minutes are less than 60"
            ));
        });

        test("Should send error embed if not a guild message", async () => {
            const alarm = new Alarm();
            Object.defineProperty(message, "guild", {
                value: null,
                writable: true
            });
            await alarm.useCommand(client, message, ["create", "1234567", "10:00", "am", "Test 123"]);
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed("Not a valid guild"));
        });

        test("Should send error embed if no target channel", async () => {
            channelManager.resolve = jest.fn().mockReturnValue(null);
            const alarm = new Alarm();
            await alarm.useCommand(client, message, ["create", "1234567", "10:00", "am", "Test 123"]);
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed("Cannot find channel"));
        });

        test("Should send error embed if target channel isn't a text channel", async () => {
            channelManager.resolve = jest.fn().mockReturnValue(voiceChannel);
            const alarm = new Alarm();
            await alarm.useCommand(client, message, ["create", "1234567", "10:00", "am", "Test 123"]);
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed("Target channel needs to be a text channel"));
        });

        test("Should create alarm with valid inputs", async () => {
            channelManager.resolve = jest.fn().mockReturnValue(channel);
            channel.id = "1234";
            const createAlarmMock = jest.fn();
            alarmProcessor.createAlarm = createAlarmMock;
            const alarm = new Alarm();
            await alarm.useCommand(client, message, ["create", "1234567", "10:00", "am", "Test 123"]);
            expect(createAlarmMock).toHaveBeenCalledWith(
                message,
                channel,
                10,
                0,
                "Test 123"
            );
        });
    });

    test("List alarms should call sendAlarmListEmbed", async () => {
        const alarm = new Alarm();
        alarmProcessor.sendAlarmListEmbed = jest.fn();

        await alarm.useCommand(client, message, ["list"]);


        expect(alarmProcessor.sendAlarmListEmbed).toHaveBeenCalledWith(message);
    });

    describe("Delete alarm tests", () => {
        test("Not enough arguments should give error", async () => {
            const alarm = new Alarm();
            await alarm.useCommand(client, message, ["delete"]);
            expect(channel.send).toHaveBeenCalledWith(
                getErrorEmbed(
                    "Incorrect syntax. Try `-alarm delete [id]` where the ID is the ID of the alarm from `-alarm list`"
                )
            );
        });

        test("Given id, should try to delete alarm", async () => {
            alarmProcessor.deleteAlarm = jest.fn();
            const alarm = new Alarm();
            await alarm.useCommand(client, message, ["delete", "1"]);
            expect(alarmProcessor.deleteAlarm).toHaveBeenCalledWith(message, "1");
        });
    });

    test("Given no valid first arg, should error embed", async () => {
        alarmProcessor.deleteAlarm = jest.fn();
        const alarm = new Alarm();
        await alarm.useCommand(client, message, ["asdefgh", ""]);
        expect(channel.send).toHaveBeenCalledWith(
            getErrorEmbed(
                "Invalid command. Type `-alarm` to see the possible arguments"
            )
        );
    });

    test("Given no args, should give explanatory error", async () => {
        alarmProcessor.deleteAlarm = jest.fn();
        const alarm = new Alarm();
        await alarm.useCommand(client, message, []);
        expect(channel.send).toHaveBeenCalledWith(
            getErrorEmbed(
                "Incorrect syntax. Try `-alarm [create|list|delete]`.\n" +
                "Use of them to see the syntax for it"
            )
        );
    });

    test("configBase should be alarm", () => {
        const alarm = new Alarm();
        expect(alarm.getConfigBase()).toEqual("alarm");
    });

    test("getCommand should be [alarm]", () => {
        const alarm = new Alarm();
        expect(alarm.getCommand()).toEqual(["alarm"]);
    });

    test("Expect command to require administrator permission", () => {
        const alarm = new Alarm();
        expect(alarm.getRequiredPermission()).toEqual(Permissions.FLAGS.ADMINISTRATOR);
    });

    afterAll(() => {
        client.destroy();
    })
});
