import { Client, DMChannel, Message } from "discord.js";
import { Command } from "./Command";
import { Big } from "./Big";
import { Bus } from "./Bus";
import { EmojiTop } from "./EmojiTop";
import { Courses } from "./Courses";
import { removeEmptyArgs } from "../utils/StringUtil";
import { Mod } from "./Mod";
import { Food } from "./Food";
import { FoodSpecials } from "./FoodSpecials";
import { EmojiRole } from "./EmojiRole";
import { Pin } from "./Pin";
import { Config } from "./Config";

/**
 * Class to contain the registry of commands for the discord bot
 */
export class CommandRegistry {
  private registry: Command[] = [];

  /**
   * If the command registry is being created, fill the registry
   * with the various commands
   * @param init whether or not it should initialize the registry
   */
  constructor(init = true) {
    if (init) {
      this.registry.push(new Food());
      this.registry.push(new FoodSpecials());
      this.registry.push(new Mod());
      this.registry.push(new EmojiRole());
      this.registry.push(new Courses());
      this.registry.push(new Bus());
      this.registry.push(new Big());
      this.registry.push(new EmojiTop());
      this.registry.push(new Pin());
      this.registry.push(new Config());
    }
  }

  /**
   * Run through the command registry and perform the following checks
   * - message channel isn't a DM
   * - the message channel isn't in the list of prohibited channels for the command
   * - the content starts with the command being tested
   * - the user has permission to use the command
   * If all checks pass, call the useCommand method on the command
   * @param client Discord Client
   * @param messageEvent The discord.js message
   */
  runCommands(client: Client, messageEvent: Message): void {
    if (messageEvent.author.bot) {
      return;
    }
    this.registry.forEach(async (command: Command) => {
      // TODO: Make string of IFs less hideous
      if (!(messageEvent.channel instanceof DMChannel)) {
        const prohibitedChannels = await command.getProhibitedChannels(
          messageEvent.channel.guild.id
        );
        if (!prohibitedChannels.includes(messageEvent.channel.id)) {
          if (
            messageEvent.content
              .toLowerCase()
              .startsWith(`-${command.getCommand()}`)
          ) {
            if (
              messageEvent.member &&
              messageEvent.member.hasPermission(command.getRequiredPermission())
            ) {
              const args = messageEvent.content.trim().split(" ").slice(1);
              await command.useCommand(
                client,
                messageEvent,
                removeEmptyArgs(args)
              );
            }
          }
        }
      }
    });
  }
}
