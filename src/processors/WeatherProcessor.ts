import axios from 'axios';
import { WeatherResponse } from '../types/Weather';
import {MessageEmbed} from 'discord.js';

const WEATHER_BASE_URL =
    'https://api.openweathermap.org/data/2.5/weather?units=imperial';

export class WeatherProcessor {
    static async getWeather(zip: string): Promise<WeatherResponse | Error> {
        try {
            const resp = await axios.get<WeatherResponse>(
                `${WEATHER_BASE_URL}&appid=${process.env.openweathermap_api_key}&zip=${zip}`
            );
            return resp.data;
        } catch (e) {
            return e;
        }
    }


    static getEmbed(zip: string, weather: WeatherResponse) {
        const embed = new MessageEmbed();
        const weatherData = weather.weather[0];
        const temp = weather.main;
        embed.addField(`Weather for ${zip}`, weatherData.description);
        embed.addField(
            'Temperature',
            `**High**: ${temp.temp_max} °F\n` +
            `**Low**: ${temp.temp_min} °F\n` +
            `**Current**: ${temp.temp} °F\n`
        );
        embed.addField(
            'Humidity', `${temp.humidity}%`, true
        );
        embed.addField(
            'Wind',
            `**Wind Speed**: ${weather.wind.speed} mph\n` +
            (weather.wind.gust ? `**Wind Gust**: ${weather.wind.gust} mph\n` : '')
        );
        if (weather.rain) {
            embed.addField(
                'Rain',
                `**Last 3 hours**: ${weather.rain['3h']} mm`
            );
        }
        if (weather.snow) {
            embed.addField(
                'Snow',
                `**Last 3 hours**: ${weather.snow['3h']} mm`
            );
        }

        return embed;
    }
}
