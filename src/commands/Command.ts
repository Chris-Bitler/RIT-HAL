import { Client, Message, Permissions } from "discord.js";
import { ConfigProperty } from "../models/ConfigProperty";

/**
 * Class representing a command
 */
export class Command {
  /**
   * The function called when a command is used
   * @param {Client} client The discord.js client
   * @param {Message} evt The message event from discord.js
   * @param {string[]} args Arguments given with the command
   */
  async useCommand(
    client: Client,
    evt: Message,
    args: string[]
  ): Promise<void> {
    throw new Error("You need to implement useCommand");
  }

  /**
   * Get the textual version of the command minus prefix
   */
  getCommand(): string {
    throw new Error("You need to implement getCommand");
  }

  /**
   * Get the permission required to use the command
   */
  getRequiredPermission(): number {
    // TODO: Is this the correct default permission?
    // Should be since they need to view the channel to use the command..
    return Permissions.FLAGS.VIEW_CHANNEL;
  }

  /**
   * The first section of any config property related to this command
   */
  getConfigBase(): string {
    return "base";
  }

  /**
   * Get the list of channel IDs that this command can't be used in
   */
  async getProhibitedChannels(guildId: string): Promise<string[]> {
    const prohibitedChannelsJSON = await ConfigProperty.getServerProperty(
      `${this.getConfigBase()}.prohibited`,
      guildId
    );
    if (prohibitedChannelsJSON?.value) {
      return JSON.parse(prohibitedChannelsJSON.value) as string[];
    } else {
      return [];
    }
  }
}
