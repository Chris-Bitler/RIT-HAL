import {
    GuildMember,
    TextChannel,
    Client,
    Guild,
    GuildMemberRoleManager,
    Collection,
    Role,
    User,
    GuildMemberManager, GuildManager, GuildChannelManager
} from "discord.js";
import {ConfigProperty} from "../../src/models/ConfigProperty";
import {ModProcessor} from "../../src/processors/ModProcessor";
import {Punishment} from "../../src/models/Punishment";
import {getErrorEmbed} from "../../src/utils/EmbedUtil";

jest.mock('../../src/processors/LogProcessor', () => {
    return {
        LogProcessor: {
            getLogger: () => {
                return {
                    info: jest.fn(),
                    error: jest.fn()
                }
            }
        }
    }
});

describe("ModProcessor tests", () => {
    let member: GuildMember;
    let user: User;
    let channel: TextChannel;
    let staffMember: GuildMember;
    let staffUser: User;
    let client: Client;
    let guild: Guild;
    let memberManager: GuildMemberManager;
    let roleManager: GuildMemberRoleManager;
    let guildChannelManager: GuildChannelManager;
    let guildManager: GuildManager;
    let roleCollection: Collection<string, Role>;
    let role: Role;
    let sendMock: jest.MockedFunction<typeof channel.send>;
    let mockDateNow: jest.MockedFunction<typeof Date.now>;
    beforeEach(() => {
        delete ModProcessor.instance;
        const MockDiscord = jest.genMockFromModule<any>("discord.js");
        member = new MockDiscord.GuildMember();
        staffMember = new MockDiscord.GuildMember();
        user = new MockDiscord.User();
        staffUser = new MockDiscord.User();
        channel = new MockDiscord.TextChannel();
        client = new MockDiscord.Client();
        guild = new MockDiscord.Guild();
        guildManager = new MockDiscord.GuildManager();
        roleManager = new MockDiscord.RoleManager();
        memberManager = new MockDiscord.GuildMemberManager();
        guildChannelManager = new MockDiscord.GuildChannelManager();
        guild.channels = guildChannelManager;
        role = new MockDiscord.Role();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        roleCollection = new MockDiscord.Collection<string, Role>();
        roleManager.cache = roleCollection;
        roleCollection.get = jest.fn().mockReturnValue(role);
        Object.defineProperty(member, "roles", {
            value: roleManager
        });
        Punishment.create = jest.fn();
        sendMock = jest.fn();
        channel.send = sendMock;
        guildChannelManager.resolve = jest.fn().mockReturnValue(null);
        mockDateNow = jest.fn();
        roleManager.remove = jest.fn();
        Date.now = mockDateNow;

        Object.defineProperty(member, "id", {
            value: "123"
        });
        Object.defineProperty(staffMember, "id", {
            value: "456"
        });
        member.user = user;
        staffMember.user = staffUser;
        user.username = "Test1";
        user.id = "1";
        staffUser.username = "Test2";
        staffUser.id = "2";
        member.guild = guild;
        staffMember.guild = guild;
        guild.id = "1";
        guild.members = memberManager;
        client.guilds = guildManager;
    });
    describe("Mute user tests", () => {
        test("Should create mute", async () => {
            ModProcessor.getInstance().mutes.push({
                memberId: "123",
                muterId: "2",
                serverId: "1",
                reason: "Test",
                expiration: 1001
            });
            ConfigProperty.findOne = jest.fn().mockReturnValue({
                value: "12345"
            });
            roleManager.add = jest.fn();
            roleCollection.get = jest.fn().mockReturnValue(undefined);
            mockDateNow.mockReturnValue(1000);
            const mockCreate = (Punishment.create as jest.MockedFunction<typeof Punishment.create>);

            await ModProcessor.getInstance().muteUser(member, channel, staffMember, "test reason", 1);

            expect(mockCreate).toHaveBeenCalledWith({
                userId: "123",
                userName: "Test1",
                punisherId: "456",
                punisherName: "Test2",
                type: "mute",
                reason: "test reason",
                active: true,
                expiration: 1001,
                serverId: "1"
            });
            expect(channel.send).toHaveBeenCalled();
            expect(member.send).toHaveBeenCalled();
            expect(ModProcessor.instance.mutes.length).toEqual(1);
        });


        test("Should send error message if no mute role defined", async () => {
            ConfigProperty.findOne = jest.fn().mockReturnValue(null);
            await ModProcessor.getInstance().muteUser(member, channel, staffMember, "test reason", 1);
            expect(staffMember.send).toHaveBeenCalledWith(
                getErrorEmbed("Your server admin needs to set the ID of the muted role before you can use this command.")
            )
        });
    });

    describe("Ban user tests", () => {
        test("Should create Ban", async () => {
            ModProcessor.getInstance().bans.push({
                memberId: "123",
                bannerId: "456",
                serverId: "1",
                reason: "Test",
                expiration: 1001
            });
            mockDateNow.mockReturnValue(1000);
            const mockCreate = (Punishment.create as jest.MockedFunction<typeof Punishment.create>);

            await ModProcessor.getInstance().banUser(member, staffMember, "test reason", 1);

            expect(mockCreate).toHaveBeenCalledWith({
                userId: "123",
                userName: "Test1",
                punisherId: "456",
                punisherName: "Test2",
                type: "ban",
                reason: "test reason",
                active: true,
                expiration: 1001,
                serverId: "1"
            });
            expect(member.send).toHaveBeenCalled();
            expect(member.ban).toHaveBeenCalled();
            expect(ModProcessor.instance.bans.length).toEqual(1);
        });


        test("Should send error if ban fails", async () => {
            ConfigProperty.findOne = jest.fn().mockReturnValue(null);
            (member.ban as jest.MockedFunction<typeof member.ban>).mockRejectedValueOnce("Error");
            await ModProcessor.getInstance().banUser(member, staffMember, "test reason", 1);
            expect(staffMember.send).toHaveBeenCalledWith(
                getErrorEmbed("An error occurred when trying to ban that user.")
            );
            expect(member.ban).toHaveBeenCalledTimes(2);
        });
    });

    describe("Unban tests", () => {
        test("Should unban user and update db if ban exists", async () => {
            ModProcessor.getInstance().bans.push({
                memberId: "1",
                bannerId: "2",
                serverId: "1",
                reason: "Test",
                expiration: 1001
            });
            const unbanMock = jest.fn();
            const updateMock = jest.fn();
            memberManager.unban = unbanMock;
            Punishment.update = updateMock;

            await ModProcessor.getInstance().unbanUser(guild, user, true);
            expect(unbanMock).toHaveBeenCalled();
            expect(updateMock).toHaveBeenCalledWith({
                active: false
            }, {
                where: {
                    userId: "1",
                    serverId: "1",
                    type: "ban"
                }
            });
        });
    });

    describe("Unmute tests", () => {
        test("Should unmute user and update db if mute exists", async () => {
            ModProcessor.getInstance().mutes.push({
                memberId: "123",
                muterId: "2",
                serverId: "1",
                reason: "Test",
                expiration: 1001
            });
            memberManager.resolve = jest.fn().mockReturnValue(member);
            ConfigProperty.findOne = jest.fn().mockReturnValue({
                value: "12345"
            });
            const updateMock = jest.fn();
            Punishment.update = updateMock;

            await ModProcessor.getInstance().unmuteUser(guild, user);
            expect(roleManager.remove).toHaveBeenCalled();
            expect(updateMock).toHaveBeenCalledWith({
                active: false
            }, {
                where: {
                    userId: "123",
                    serverId: "1",
                    type: "mute"
                }
            });
        });

        test("Should not unmute user if mute doesn't exist", async () => {
            const updateMock = jest.fn();
            Punishment.update = updateMock;

            await ModProcessor.getInstance().unmuteUser(guild, user);
            expect(updateMock).not.toHaveBeenCalled();
        });
    });

    describe("Test kick user", () => {
        test("Should kick user and create punishment", async () => {
            const createMock = jest.fn();
            member.kick = jest.fn();
            Punishment.create = createMock;

            await ModProcessor.getInstance().kickUser(member, staffMember, "test");
            expect(createMock).toHaveBeenCalledWith({
                userId: "123",
                userName: "Test1",
                punisherId: "456",
                punisherName: "Test2",
                type: "kick",
                reason: "test",
                serverId: "1",
                expiration: 0
            });
            expect(member.send).toHaveBeenCalled();
            expect(member.kick).toHaveBeenCalled();
        });
        test("Should kick user and create punishment if errored first time", async () => {
            const createMock = jest.fn();
            member.kick = jest.fn();
            staffMember.send = jest.fn();
            Punishment.create = createMock;
            (member.send as jest.MockedFunction<typeof member.send>).mockRejectedValueOnce("Error");

            await ModProcessor.getInstance().kickUser(member, staffMember, "test");
            expect(createMock).toHaveBeenCalledWith({
                userId: "123",
                userName: "Test1",
                punisherId: "456",
                punisherName: "Test2",
                type: "kick",
                reason: "test",
                serverId: "1",
                expiration: 0
            });
            expect(staffMember.send).toHaveBeenCalledTimes(1);
            expect(member.kick).toHaveBeenCalled();
        });
    });

    describe("Warn user tests", () => {
        test("Should warn user and create punishment", async () => {
            const createMock = jest.fn();
            staffMember.send = jest.fn();
            member.send = jest.fn();
            Punishment.create = createMock;

            await ModProcessor.getInstance().warnUser(member, staffMember, "test");
            expect(createMock).toHaveBeenCalledWith({
                userId: "123",
                userName: "Test1",
                punisherId: "456",
                punisherName: "Test2",
                type: "warn",
                reason: "test",
                serverId: "1",
                expiration: 0
            });
            expect(member.send).toHaveBeenCalled();
        });

        test("Should warn user and create punishment if errored first time", async () => {
            const createMock = jest.fn();
            staffMember.send = jest.fn();
            member.send = jest.fn().mockRejectedValueOnce("Error");
            Punishment.create = createMock;

            await ModProcessor.getInstance().warnUser(member, staffMember, "test");
            expect(createMock).toHaveBeenCalledWith({
                userId: "123",
                userName: "Test1",
                punisherId: "456",
                punisherName: "Test2",
                type: "warn",
                reason: "test",
                serverId: "1",
                expiration: 0
            });
            expect(member.send).toHaveBeenCalled();
            expect(staffMember.send).toHaveBeenCalled();
        });
    });

    test("isUserMuted should return true if user is muted", () => {
        ModProcessor.getInstance().mutes.push({
            memberId: "123",
            muterId: "2",
            serverId: "1",
            reason: "Test",
            expiration: 1001
        });
        expect(ModProcessor.getInstance().isUserMuted(member)).toEqual(true);
    });

    describe("reassign user muted role tests", () => {
        test("reassign user muted role should reassign role if exists", async () => {
            ConfigProperty.findOne = jest.fn().mockReturnValue({
                value: "12345"
            });
            await ModProcessor.getInstance().reassignUserMutedRole(member);
            expect(roleManager.add).toHaveBeenCalledWith("12345");
        });
        test("reassign user muted role should not reassign role if none exists", async () => {
            ConfigProperty.findOne = jest.fn().mockReturnValue(null);
            await ModProcessor.getInstance().reassignUserMutedRole(member);
            expect(roleManager.add).not.toHaveBeenCalledWith("12345");
        });
    });

    test("should load punishments from database", async () => {
        Punishment.findAll = jest.fn().mockResolvedValue([{
            userId: "123",
            userName: "Test1",
            punisherId: "456",
            punisherName: "Test2",
            type: "mute",
            reason: "test",
            active: true,
            serverId: "1",
            expiration: 1
        },{
            userId: "123",
            userName: "Test1",
            punisherId: "456",
            punisherName: "Test2",
            type: "ban",
            reason: "test",
            active: true,
            serverId: "1",
            expiration: 1
        },{
            userId: "123",
            userName: "Test1",
            punisherId: "456",
            punisherName: "Test2",
            type: "kick",
            reason: "test",
            active: false,
            serverId: "1",
            expiration: 0
        }]);

        await ModProcessor.getInstance().loadPunishmentsFromDB();

        expect(ModProcessor.getInstance().mutes.length).toEqual(1);
        expect(ModProcessor.getInstance().bans.length).toEqual(1);
    });

    describe("Tick punishment tests", () => {
       test("Should remove punishments where necessary", async () => {
           mockDateNow.mockReturnValue(100000000000);
           ModProcessor.getInstance().mutes.push({
               memberId: "123",
               muterId: "2",
               serverId: "1",
               reason: "Test",
               expiration: 1001
           });
           ModProcessor.getInstance().bans.push({
               memberId: "1",
               bannerId: "2",
               serverId: "1",
               reason: "Test",
               expiration: 1001
           });
           guildManager.resolve = jest.fn().mockReturnValue(guild);
           await ModProcessor.getInstance().tickPunishments(client);
       });
    });

    test("Should not remove punishments if can't find guild", async () => {
        mockDateNow.mockReturnValue(100000000000);
        ModProcessor.getInstance().mutes.push({
            memberId: "123",
            muterId: "2",
            serverId: "1",
            reason: "Test",
            expiration: 1001
        });
        ModProcessor.getInstance().bans.push({
            memberId: "1",
            bannerId: "2",
            serverId: "1",
            reason: "Test",
            expiration: 1001
        });
        guildManager.resolve = jest.fn().mockReturnValue(null);
        await ModProcessor.getInstance().tickPunishments(client);
    });

    test("fetchPunishments", async () => {
        Punishment.findAll = jest.fn().mockResolvedValue([{
            userId: "123",
            userName: "Test1",
            punisherId: "456",
            punisherName: "Test2",
            type: "mute",
            reason: "test",
            active: true,
            serverId: "1",
            expiration: 1
        },{
            userId: "123",
            userName: "Test1",
            punisherId: "456",
            punisherName: "Test2",
            type: "ban",
            reason: "test",
            active: true,
            serverId: "1",
            expiration: 1
        },{
            userId: "123",
            userName: "Test1",
            punisherId: "456",
            punisherName: "Test2",
            type: "kick",
            reason: "test",
            active: false,
            serverId: "1",
            expiration: 0
        }]);
        const value = await ModProcessor.getInstance().fetchPunishments("1", "123");
        expect(value.length).toEqual(3);
    });
});