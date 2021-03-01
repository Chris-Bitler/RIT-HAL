import { Command } from './Command';
import { Client, Message } from 'discord.js';
import { getFoodEmbed, getOpenPlaces } from '../processors/FoodProcessor';
import { getErrorEmbed } from '../utils/EmbedUtil';
import * as sentry from '@sentry/node';

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
            } else {
                evt.channel.send(
                    getErrorEmbed('No food places are open currently.')
                );
            }
        } catch (err) {
            sentry.captureException(err);
            evt.channel.send(
                getErrorEmbed(
                    'Error occurred trying to process open food places.'
                )
            );
        }
    }

    getCommand(): string[] {
        return ['rit food'];
    }

    getConfigBase(): string {
        return 'food';
    }
}
