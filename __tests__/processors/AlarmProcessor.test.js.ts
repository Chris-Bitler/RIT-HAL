import {Alarm} from "../../src/models/Alarm";
import {ChannelManager, Client, Guild, GuildManager, Message, MessageEmbed, TextChannel} from "discord.js"
import {AlarmProcessor} from "../../src/processors/AlarmProcessor";
import {getErrorEmbed, getInformationalEmbed} from "../../src/utils/EmbedUtil";
import moment = require("moment-timezone");

jest.mock("../../src/models/Alarm");

const timezoneMock = {
    tz: jest.fn(),
    valueOf: jest.fn(),
    hours: jest.fn(),
    minutes: jest.fn()
};
jest.mock("moment-timezone", () => () => (timezoneMock));

const mockAlarm = {
    hours: 1,
    minutes: 1,
    message: "Test",
    lastSent: 0,
    channelId: "1234",
    serverId: "1234",
    id: "1"
};
describe("Alarm processor tests", () => {
    let channel: TextChannel;
    let message: Message;
    let guild: Guild;
    let guildManager: GuildManager;
    let targetChannel: TextChannel;
    let channelManager: ChannelManager;
    let sendMock: jest.MockedFunction<typeof channel.send>;
    let client: Client;
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        channel = new MockDiscord.TextChannel();
        targetChannel = new MockDiscord.TextChannel();
        guild = new MockDiscord.Guild();
        message = new MockDiscord.Message();
        client = new MockDiscord.Client();
        guildManager = new MockDiscord.GuildManager();
        channelManager = new MockDiscord.ChannelManager();
        client.guilds = guildManager;
        client.channels = channelManager;
        message.channel = channel;
        targetChannel.id = "654321";
        channel.id = "123456";
        guild.id = "1234";
        sendMock = jest.fn();
        channel.send = sendMock;
        Object.defineProperty(message, 'guild', {
            value: guild,
            writable: true
        });
    });

    describe("Create alarm", () => {
        let create: jest.MockedFunction<typeof Alarm.create>;
        let dateNowMock: jest.MockedFunction<typeof Date.now>;
        beforeEach(() => {
            create = Alarm.create as jest.MockedFunction<typeof Alarm.create>;
            create.mockReset();
            create.mockResolvedValue({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                id: 1
            });
            dateNowMock = jest.fn();
            delete AlarmProcessor.instance;
        });
        test("Creating an alarm before the time", async () => {
            timezoneMock.tz.mockReturnValue(moment());
            timezoneMock.valueOf.mockReturnValue(2);
            dateNowMock.mockReturnValue(1);
            Date.now = dateNowMock;

            await AlarmProcessor.getInstance().createAlarm(message, targetChannel, 1, 1, "Test");
            expect(create.mock.calls[0][0]).toEqual({
                lastUsed: 0,
                channelId: targetChannel.id,
                serverId: guild.id,
                hours: 1,
                minutes: 1,
                messageToSend: "Test"
            });
            expect(AlarmProcessor.getInstance().alarms[0]).toEqual({
                hours: 1,
                minutes: 1,
                message: "Test",
                lastSent: 0,
                channelId: targetChannel.id,
                serverId: guild.id,
                id: 1
            });
            expect(sendMock.mock.calls[0][0]).toEqual(
                getInformationalEmbed(
                    "Alarm created",
                    `An alarm for ${channel} was created to go off at 1:01 am saying Test`
                )
            );
        });
        test("Creating an alarm after the time", async () => {
            timezoneMock.tz.mockReturnValue(moment());
            timezoneMock.valueOf.mockReturnValue(1);
            dateNowMock.mockReturnValue(2);
            Date.now = dateNowMock;

            await AlarmProcessor.getInstance().createAlarm(message, targetChannel, 13, 1, "Test");
            expect(create.mock.calls[0][0]).toEqual({
                lastUsed: 1,
                channelId: targetChannel.id,
                serverId: guild.id,
                hours: 13,
                minutes: 1,
                messageToSend: "Test"
            });
            expect(AlarmProcessor.getInstance().alarms[0]).toEqual({
                hours: 13,
                minutes: 1,
                message: "Test",
                lastSent: 1,
                channelId: targetChannel.id,
                serverId: guild.id,
                id: 1
            });
            expect(sendMock.mock.calls[0][0]).toEqual(
                getInformationalEmbed(
                    "Alarm created",
                    `An alarm for ${channel} was created to go off at 1:01 pm saying Test`
                )
            );
        });
    });

    describe("Get alarm tests", () => {
        beforeEach(() => {
            delete AlarmProcessor.instance;
        })
        test("Get alarms for valid guild", () => {
            AlarmProcessor.getInstance().alarms = [mockAlarm];
            expect(AlarmProcessor.getInstance().getAlarms(message)).toEqual([mockAlarm]);
        });
        test("Get alarms for invalid guild", () => {
            Object.defineProperty(message, "guild", {
                value: null,
                writable: false
            });
            AlarmProcessor.getInstance().alarms = [mockAlarm];
            expect(AlarmProcessor.getInstance().getAlarms(message)).toEqual([]);
        });
    });

    test("Load alarm tests", async () => {
        delete AlarmProcessor.instance;
        const alarmMock = Alarm.findAll as jest.MockedFunction<any>;
        alarmMock.mockResolvedValue([
            {
                lastUsed: 1,
                hours: 1,
                minutes: 1,
                message: "Test",
                channelId: "1",
                serverId: "1",
                id: "1"
            },
            {
                lastUsed: 2,
                hours: 2,
                minutes: 2,
                message: "Test",
                channelId: "22",
                serverId: "2",
                id: "2"
            }
        ]);

        await AlarmProcessor.getInstance().loadAlarms();

        expect(AlarmProcessor.getInstance().alarms.length).toEqual(2);
    });

    describe("Send list embed test", () => {
        beforeEach(() => {
            delete AlarmProcessor.instance;
        })
        test("Send embed with alarms - am", async () => {
            AlarmProcessor.getInstance().alarms = [mockAlarm];
            const expectedEmbed = new MessageEmbed();
            expectedEmbed.setTitle("Alarms");
            expectedEmbed.addField("Alarms", `**ID:** 1\n` +
                `**Time:** 1:01 am\n` +
                `**Message:** Test\n\n`);

            await AlarmProcessor.getInstance().sendAlarmListEmbed(message);

            expect(message.channel.send).toHaveBeenCalledWith(expectedEmbed);
        });

        test("Send embed with alarms - pm", async () => {
            mockAlarm.hours = 14;
            AlarmProcessor.getInstance().alarms = [mockAlarm];
            const expectedEmbed = new MessageEmbed();
            expectedEmbed.setTitle("Alarms");
            expectedEmbed.addField("Alarms", `**ID:** 1\n` +
                `**Time:** 2:01 pm\n` +
                `**Message:** Test\n\n`);

            await AlarmProcessor.getInstance().sendAlarmListEmbed(message);

            expect(message.channel.send).toHaveBeenCalledWith(expectedEmbed);
            mockAlarm.hours = 1;
        });

        test("Send embed with no alarms", async () => {
            AlarmProcessor.getInstance().alarms = [];

            await AlarmProcessor.getInstance().sendAlarmListEmbed(message);

            expect(message.channel.send).toHaveBeenCalledWith(getErrorEmbed("No alarms found"));
        });
    });

    describe("Delete alarm tests", () => {
        const mockFindOne = jest.fn();
        const mockDestroy = jest.fn();
        beforeEach(() => {
            Alarm.findOne = mockFindOne;
            Alarm.destroy = mockDestroy;
            delete AlarmProcessor.instance;
        });

        test("Alarm exists and belongs to guild - delete", async () => {
            mockAlarm.id = "2";
            AlarmProcessor.getInstance().alarms = [mockAlarm];
            mockFindOne.mockResolvedValue({
                lastUsed: 2,
                hours: 2,
                minutes: 2,
                message: "Test",
                channelId: "22",
                serverId: "2",
                id: "2"
            });
            const dateNowMock = jest.fn();
            Date.now = dateNowMock;
            dateNowMock.mockReturnValue(1);
            guild.id = "2";

            await AlarmProcessor.getInstance().deleteAlarm(message, "2");
            expect(mockDestroy).toHaveBeenCalledWith({
                where: {
                    id: "2"
                }
            });
            expect(AlarmProcessor.getInstance().alarms.length).toEqual(0);
            expect(channel.send).toHaveBeenCalledWith(
                getInformationalEmbed(
                    "Alarm deleted",
                    "The alarm with the id 2 was deleted."
                )
            );
        });

        test("Alarm exists and doesn't belong to guild", async () => {
            mockAlarm.id = "2";
            AlarmProcessor.getInstance().alarms = [mockAlarm];
            const dateNowMock = jest.fn();
            Date.now = dateNowMock;
            dateNowMock.mockReturnValue(1);
            mockFindOne.mockResolvedValue({
                lastUsed: 2,
                hours: 2,
                minutes: 2,
                message: "Test",
                channelId: "22",
                serverId: "3",
                id: "2"
            });
            guild.id = "2";

            await AlarmProcessor.getInstance().deleteAlarm(message, "2");
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed("That alarm doesn't belong to this server."));
        });

        test("Alarm doesn't exist", async () => {
            const dateNowMock = jest.fn();
            Date.now = dateNowMock;
            dateNowMock.mockReturnValue(1);
            mockFindOne.mockResolvedValue(null);

            await AlarmProcessor.getInstance().deleteAlarm(message, "2");
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed("No alarm with that id exists"));
        });

        test("Alarm exists but guild doesn't", async () => {
            const dateNowMock = jest.fn();
            Date.now = dateNowMock;
            dateNowMock.mockReturnValue(1);
            mockFindOne.mockResolvedValue({
                lastUsed: 2,
                hours: 2,
                minutes: 2,
                message: "Test",
                channelId: "22",
                serverId: "3",
                id: "2"
            });
            Object.defineProperty(message, "guild", {
                value: null,
                writable: false
            });

            await AlarmProcessor.getInstance().deleteAlarm(message, "2");
            expect(channel.send).toHaveBeenCalledWith(getErrorEmbed("No alarm with that id exists"));
        });
    });

    test("Tick Alarms test", async () => {
        delete AlarmProcessor.instance;
        timezoneMock.tz.mockReturnValue(moment());
        timezoneMock.valueOf.mockReturnValue(9999999);
        timezoneMock.hours.mockReturnValue(14);
        timezoneMock.minutes.mockReturnValue(59);
        mockAlarm.id = "2";
        mockAlarm.hours = 13;
        mockAlarm.minutes = 0;
        mockAlarm.lastSent = 0;
        const mockNow = jest.fn();
        Date.now = mockNow;
        mockNow.mockReturnValue(99999999999);
        AlarmProcessor.getInstance().alarms = [mockAlarm];
        const mockResolve = jest.fn();
        guildManager.resolve = mockResolve;
        mockResolve.mockReturnValue(guild);
        const mockChannelResolve = jest.fn();
        channelManager.resolve = mockChannelResolve;
        mockChannelResolve.mockReturnValue(channel);
        Alarm.update = jest.fn();
        await AlarmProcessor.getInstance().tickAlarms(client);

        expect(channel.send).toHaveBeenCalledWith("Test");
        expect(Alarm.update).toHaveBeenCalled();
        expect(mockAlarm.lastSent).toEqual(99999999999);
    });
});