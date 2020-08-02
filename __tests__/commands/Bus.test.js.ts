import {
    refreshInformation,
    getActiveRoutes,
    getRouteByNumber,
    getArrivalTimes, getRouteByName
} from "../../src/processors/BusProcessor";
import {Client, Guild, GuildMember, GuildMemberManager, Message, MessageEmbed, TextChannel, User} from "discord.js";
import {Bus} from "../../src/commands/Bus";
import {BusRoute} from "../../src/types/Bus";
import {ConfigProperty} from "../../src/models/ConfigProperty";

jest.mock("../../src/processors/BusProcessor");

describe("Bus command tests", () => {
    let channel: TextChannel;
    let message: Message;
    let guild: Guild;
    let memberManager: GuildMemberManager;
    let user: User;
    let member: GuildMember;
    let client: Client;
    let mockSend: jest.MockedFunction<typeof channel.send>;
    beforeEach(() => {
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        channel = new MockDiscord.TextChannel();
        message = new MockDiscord.Message();
        guild = new MockDiscord.Guild();
        memberManager = new MockDiscord.GuildMemberManager(guild, null);
        user = new MockDiscord.User();
        member = new MockDiscord.GuildMember();
        message.channel = channel;
        message.author = user;
        channel.guild = guild;
        guild.members = memberManager;
        member.hasPermission = jest.fn().mockReturnValue(true);
        (memberManager.resolve as jest.MockedFunction<typeof memberManager.resolve>).mockReturnValue(member);
        mockSend = channel.send as jest.MockedFunction<typeof channel.send>;
        client = new Client();
    });

    describe("forceRefresh tests", () => {
        beforeEach(() => {
            (refreshInformation as jest.MockedFunction<typeof refreshInformation>).mockReset();
        })
        test("forceRefresh should call refreshInformation and send message", async () => {
            const bus = new Bus();
            await bus.forceRefresh(channel, true);

            expect(refreshInformation).toHaveBeenCalled();
            expect(channel.send).toHaveBeenCalled();
        });

        test("forceRefresh should call refreshInformation and send message when called from useCommand", async () => {
            const bus = new Bus();
            await bus.useCommand(client, message, ["forcerefresh"]);

            expect(refreshInformation).toHaveBeenCalled();
            expect(channel.send).toHaveBeenCalled();
        });

        test("forceRefresh should not call refreshInformation if no perms", async () => {
            const bus = new Bus();
            await bus.forceRefresh(channel, false);

            expect(refreshInformation).not.toHaveBeenCalled();
            expect(channel.send).not.toHaveBeenCalled();
        });
    });

    describe("showRoute tests", () => {
        // Also tests getRoutesEmbed
        beforeEach(() => {
            const busRoutes: BusRoute[] = [
                {
                    is_active: true,
                    long_name: "Test Route",
                    route_id: "1",
                    stops: {}
                },
                {
                    is_active: true,
                    long_name: "Test Route 2",
                    route_id: "2",
                    stops: {}
                }
            ];
            const mockGetActiveRoutes = getActiveRoutes as jest.MockedFunction<typeof getActiveRoutes>;
            mockGetActiveRoutes.mockReturnValue(busRoutes);
        });
       test("should send routes embed", () => {
           const bus = new Bus();
           bus.showRoutes(client, message);

           const resultingEmbed: MessageEmbed = mockSend.mock.calls[0][0];
           expect(resultingEmbed.title).toEqual("Active RIT Bus Routes");
           expect(resultingEmbed.fields[0].value.includes("Test Route")).toBeTruthy();
           expect(resultingEmbed.fields[0].value.includes("Test Route 2")).toBeTruthy();
       });
        test("should send routes embed from useCommand", async () => {
            const bus = new Bus();
            await bus.useCommand(client, message, ["routes"]);

            const resultingEmbed: MessageEmbed = mockSend.mock.calls[0][0];
            expect(resultingEmbed.title).toEqual("Active RIT Bus Routes");
            expect(resultingEmbed.fields[0].value.includes("Test Route")).toBeTruthy();
            expect(resultingEmbed.fields[0].value.includes("Test Route 2")).toBeTruthy();
        });
    });

    describe("showStop tests", () => {
        let mockGetRouteByNumber;
        let mockGetRouteByName;
        let mockGetArrivalTimes;
        beforeEach(() => {
            mockGetRouteByNumber = getRouteByNumber as jest.MockedFunction<typeof getRouteByNumber>;
            mockGetArrivalTimes = getArrivalTimes as jest.MockedFunction<typeof getArrivalTimes>;
            mockGetRouteByName = getRouteByName as jest.MockedFunction<typeof getRouteByName>;
            mockGetRouteByNumber.mockReturnValue({
                is_active: true,
                long_name: "Test Route 2",
                route_id: "2",
                stops: {
                    "0": {
                        routes: [],
                        stop_id: "0",
                        name: "Test Stop"
                    }
                }
            });
            mockGetRouteByName.mockReturnValue({
                is_active: true,
                long_name: "Test Route 2",
                route_id: "2",
                stops: {
                    "0": {
                        routes: [],
                        stop_id: "0",
                        name: "Test Stop"
                    }
                }
            });
            mockGetArrivalTimes.mockResolvedValue({
                "Test Stop": [{
                    time: "5 seconds"
                }]
            });
        })
        test("Not enough args should send related message", async () => {
           const bus = new Bus();
           await bus.showStops(client, message, []);
           expect(mockSend).toHaveBeenCalledWith("`Incorrect Syntax. Try -bus arrivals [route]`");
        });
        test("No valid route should return error message", async () => {
            mockGetRouteByNumber = getRouteByNumber as jest.MockedFunction<typeof getRouteByNumber>;
            mockGetRouteByNumber.mockReturnValue(null);
            const bus = new Bus();
            await bus.showStops(client, message, ["arrivals", "-1"]);
            expect(mockSend).toHaveBeenCalledWith("Invalid Route. Note: These must match the names of the routes as per -bus routes, or you must use the number of the route.");
        });
        test("No arrival times should return relevant embed", async () => {
            mockGetArrivalTimes = getArrivalTimes as jest.MockedFunction<typeof getArrivalTimes>;
            mockGetArrivalTimes.mockResolvedValue({});
            const bus = new Bus();
            await bus.showStops(client, message, ["arrivals", "0"]);
            const resultingEmbed: MessageEmbed = (channel.send as jest.MockedFunction<typeof channel.send>).mock.calls[0][0];
            expect(resultingEmbed.title).toEqual("Test Route 2 upcoming stops");
            expect(resultingEmbed.fields[0].name).toEqual("No results")
            expect(resultingEmbed.fields[0].value).toEqual("No arrival times retrieved. The bus may be stopped. Try again in a few minutes.");
        });
        test("should get route by number from useCommand", async() => {
            const bus = new Bus();
            await bus.useCommand(client, message, ["arrivals", "0"]);
            const resultingEmbed: MessageEmbed = (channel.send as jest.MockedFunction<typeof channel.send>).mock.calls[0][0];
            expect(resultingEmbed.title).toEqual("Test Route 2 upcoming stops");
            expect(resultingEmbed.fields[0].name).toEqual("Test Stop")
            expect(resultingEmbed.fields[0].value).toEqual("5 seconds");
        });
        test("should get route by number and send embed of travel times", async () => {
           const bus = new Bus();
           await bus.showStops(client, message, ["arrivals", "0"])
           const resultingEmbed: MessageEmbed = mockSend.mock.calls[0][0];
           expect(resultingEmbed.title).toEqual("Test Route 2 upcoming stops");
           expect(resultingEmbed.fields[0].name).toEqual("Test Stop")
           expect(resultingEmbed.fields[0].value).toEqual("5 seconds");
        });

        test("should get route by name and send embed of travel times", async () => {
            const bus = new Bus()
            await bus.showStops(client, message, ["arrivals", "Test Stop 2"])
            const resultingEmbed: MessageEmbed = mockSend.mock.calls[0][0];
            expect(resultingEmbed.title).toEqual("Test Route 2 upcoming stops");
            expect(resultingEmbed.fields[0].name).toEqual("Test Stop")
            expect(resultingEmbed.fields[0].value).toEqual("5 seconds");
        });
    });

    describe("test getProhibitedChannels",  () => {
        test("Should return prohibited channels", async () => {
            ConfigProperty.findOne = jest.fn().mockReturnValue({
                value: "[\"1\"]"
            });
            const bus = new Bus();
            const channels: string[] = await bus.getProhibitedChannels("1");
            expect(channels).toEqual(['1']);
        });
        test("Should return empty array if no result from findOne", async () => {
            ConfigProperty.findOne = jest.fn().mockReturnValue(null);
            const bus = new Bus();
            const channels: string[] = await bus.getProhibitedChannels("1");
            expect(channels).toEqual([]);
        });
    });

    describe("other useCommand tests", () => {
        test("not enough args", () => {
            const bus = new Bus();
            bus.useCommand(client, message, []);
            expect(message.channel.send).toHaveBeenCalledWith("`Incorrect Syntax. Try -bus routes or -bus arrivals [route]`");
        });
        test("invalid argument", () => {
            const bus = new Bus();
            bus.useCommand(client, message, ["blah"]);
            expect(message.channel.send).toHaveBeenCalledWith("`Incorrect Syntax. Try -bus routes or -bus arrivals [route]`");
        });
    });

    test("getCommand", () => {
        expect(new Bus().getCommand()).toEqual("bus");
    });
});