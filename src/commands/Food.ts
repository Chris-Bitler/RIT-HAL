import { Command } from "./Command";
import { Client, Message } from "discord.js";
import { getFoodEmbed, getOpenPlaces } from "../processors/FoodProcessor";

/**
 * Command to show what food places are open on campus right now
 */
export class Food extends Command {
  async useCommand(client: Client, evt: Message): Promise<void> {
    try {
      const openPlaces = await getOpenPlaces();
      if (openPlaces) {
        openPlaces.forEach((place) => {
          if (place.sections.length > 0) {
            evt.channel.send(getFoodEmbed(place));
          }
        });
      }
    } catch (err) {
      // TODO: Sentry logging
    }
  }

  getCommand(): string {
    return "rit food";
  }

  getConfigBase(): string {
    return "food";
  }
}
