import {
    TextChannel,
    GuildEmoji,
    Role,
    Guild,
    RoleManager,
    GuildMemberRoleManager,
    GuildMember,
    MessageReaction, Collection, ReactionUserManager
} from "discord.js";
import {EmojiToRole} from "../../src/models/EmojiToRole";
import {addEmojiRole, checkReactionToDB} from "../../src/processors/EmojiRoleProcessor";
describe("EmojiRoleProcessor tests", () => {
   let initialChannel: TextChannel;
   let guildEmoji: GuildEmoji;
   let role: Role;
   let guild: Guild;
   let channel: TextChannel;
   let member: GuildMember;
   let messageReaction: MessageReaction;
   let roleManager: RoleManager;
   let guildMemberRoleManager: GuildMemberRoleManager;
   let reactionUserManager: ReactionUserManager;
   let collection: Collection<string, Role>;
   beforeEach(() => {
       const MockDiscord = jest.genMockFromModule<any>("discord.js");
       initialChannel = new MockDiscord.TextChannel();
       channel = new MockDiscord.TextChannel();
       role = new MockDiscord.Role();
       guild = new MockDiscord.Guild();
       guildEmoji = new MockDiscord.GuildEmoji();
       roleManager = new MockDiscord.RoleManager();
       guildMemberRoleManager = new MockDiscord.GuildMemberRoleManager();
       reactionUserManager = new MockDiscord.ReactionUserManager();
       member = new MockDiscord.GuildMember();
       messageReaction = new MockDiscord.MessageReaction();
       collection = new MockDiscord.Collection();
       guildEmoji.id = "1";
       role.id = "1";
       guild.id = "1";
       channel.id = "1";
       channel.guild = guild;
       channel.guild.roles = roleManager;
       Object.defineProperty(member, "roles", {
           value: guildMemberRoleManager
       });
       member.roles.cache = collection;
       messageReaction.users = reactionUserManager;
   });

   test("addEmojiRole - create and send message", async () => {
       EmojiToRole.create = jest.fn();
       initialChannel.send = jest.fn();

       await addEmojiRole(initialChannel, guildEmoji, role, channel);

       expect(initialChannel.send).toHaveBeenCalled();
       expect(EmojiToRole.create).toHaveBeenCalledWith({
           emojiId: "1",
           roleId: "1",
           channelId: "1",
           serverId: "1"
       });
   });

    test("addEmojiRole - error and send message", async () => {
        EmojiToRole.create = jest.fn().mockRejectedValueOnce("Error");
        initialChannel.send = jest.fn();

        await addEmojiRole(initialChannel, guildEmoji, role, channel);

        expect(initialChannel.send).toHaveBeenCalled();
        expect(EmojiToRole.create).not.toHaveBeenCalledTimes(2);
    });

    describe("checkReactionToDB tests", () => {
        test("Should remove role if exists in database and user has role", async () => {
            EmojiToRole.findOne = jest.fn().mockResolvedValue({
                emojiId: "1",
                channelId: "1",
                serverId: "1",
                roleId: "1"
            });

            channel.guild.roles.resolve = jest.fn().mockReturnValue(role);
            member.roles.cache.get = jest.fn().mockReturnValue(role);
            member.roles.remove = jest.fn();
            messageReaction.users.remove = jest.fn();

            await checkReactionToDB(guildEmoji, member, channel, messageReaction);

            expect(member.roles.remove).toHaveBeenCalled();
            expect(member.send).toHaveBeenCalled();
        });

        test("Should add role if exists in database and user does not role", async () => {
            EmojiToRole.findOne = jest.fn().mockResolvedValue({
                emojiId: "1",
                channelId: "1",
                serverId: "1",
                roleId: "1"
            });

            channel.guild.roles.resolve = jest.fn().mockReturnValue(role);
            member.roles.cache.get = jest.fn().mockReturnValue(null);
            member.roles.add = jest.fn();

            await checkReactionToDB(guildEmoji, member, channel, messageReaction);

            expect(member.roles.add).toHaveBeenCalled();
            expect(member.send).toHaveBeenCalled();
        });
    });
});