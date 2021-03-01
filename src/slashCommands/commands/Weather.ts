import { ExtendedSlashCommand } from '../ExtendedSlashCommand';
import {Client} from 'discord.js';
import SlashCreator from 'slash-create/lib/creator';
import { CommandOptionType } from 'slash-create';
import CommandContext from 'slash-create/lib/context';
import {WeatherProcessor} from '../../processors/WeatherProcessor';
import {LogProcessor} from '../../processors/LogProcessor';

export class Weather extends ExtendedSlashCommand {
    client: Client;
    constructor(client: Client, creator: SlashCreator) {
        super(creator, {
            name: 'weather',
            description: 'Weather command',
            options: [
                {
                    type: CommandOptionType.STRING,
                    name: 'zip',
                    description: 'The zip code',
                    required: true
                }
            ]
        });

        this.client = client;
    }

    async run(context: CommandContext) {
        const zip = context.options.zip as string;
        const weather = await WeatherProcessor.getWeather(zip);
        if (!(weather instanceof Error)) {
            const {guild, channel} = this.getGuildChannel(this.client, context);
            if (guild && channel) {
                const weatherData = weather.weather?.[0];
                if (weatherData) {
                    await channel.send(WeatherProcessor.getEmbed(zip, weather));
                    await context.acknowledge(false);
                    return;
                } else {
                    await context.send('No weather found', {ephemeral: true})
                }
            }
            await context.send('An unknown error occurred trying to fetch the weather.', {ephemeral: true});
        } else {
            await context.send('An error occurred trying to fetch the weather. Try again later.', {ephemeral: true});
            LogProcessor.getLogger().error(weather);
        }
    }
}
