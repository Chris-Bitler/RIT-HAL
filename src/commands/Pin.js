const Command = require("./Command");
const Discord = require("discord.js");
const STARBOARD = "737419567504162877";

class Pin extends Command {
  useCommand(client, evt, args) {
    if (args && args[0] !== undefined) {
      const urlParts = args[0].split("/");
      if (urlParts.length >= 2) {
        const messageId = urlParts[urlParts.length - 1];
        const channelId = urlParts[urlParts.length - 2];
        try {
          const guild = evt.channel.guild;
          const channel = guild.channels.resolve(channelId);
          const starChannel = guild.channels.resolve(STARBOARD);
          channel.messages.fetch(messageId).then((message) => {
            const embed = new Discord.MessageEmbed();
            const messageMember = guild.members.resolve(message.author.id);
            const pinningMember = guild.members.resolve(evt.author.id);
            embed.setAuthor(messageMember.displayName, message.author.displayAvatarURL())
            embed.setDescription(message.content)
            embed.addField("Source", "[Link](" + args[0] + ")");
            embed.addField("Pinned by", pinningMember.displayName);
            if (message.attachments.size > 0) {
              message.attachments.forEach((attachment) => {
                if (!this.isImage(attachment)) {
                  embed.addField("Attachment", "[" + attachment.name + "](" + attachment.url + ")");
                } else {
                  embed.setImage(attachment.url);
                }
              })
            }
            starChannel.send(embed);
            evt.channel.send("Message from " + messageMember.displayName + " pinned in starboard.");
          });
        } catch (exception) {
          console.log(exception);
          evt.channel.send("Error sending embed to starboard channel");
        }
      } else {
        evt.channel.send("Please use a valid discord message url");
      }
    }
  }

  getCommand() {
    return "starboard";
  }

  getRequiredPermission() {
    return Discord.Permissions.FLAGS.KICK_MEMBERS
  }

  isImage(filename) {
    return filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith("gif")
  }
}

module.exports = Pin;