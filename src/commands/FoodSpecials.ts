import { Client, Message } from 'discord.js';
import { Command } from './Command';
import { getSpecials, getSpecialsEmbed } from '../processors/FoodProcessor';

/**
 * Command to show what the specials are at the various food places on campus
 */
export class FoodSpecials extends Command {
    async useCommand(client: Client, evt: Message): Promise<void> {
        const specials = await getSpecials();
        specials.forEach((place) => {
            if (place.breakfast || place.lunch || place.dinner) {
                evt.channel.send(getSpecialsEmbed(place));
            }
        });
    }

    getCommand(): string[] {
        return ['rit specials'];
    }

    getConfigBase(): string {
        return 'specials';
    }
}
