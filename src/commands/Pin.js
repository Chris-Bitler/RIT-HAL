/**
 * This file is part of RIT-HAL.
 *
 * RIT-HAL is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * RIT-HAL is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with RIT-HAL.  If not, see <https://www.gnu.org/licenses/>.
 */

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