import * as chrono from 'chrono-node';
import {ParsingResult} from "chrono-node/dist/results";
// Constants for various units of time
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_MONTH = 31;
const MONTHS_IN_YEAR = 12;

/**
 * Parse a string containing years/months/days/hours/minutes/seconds
 * into a millisecond count that can be used for storing moderation punishment
 * times.
 * @param string The string to check for time units
 */
export const parseModDateString = (string: string): number => {
    const MOD_DATE_REGEX = /(?<years>\d+\s?years?)?\s?(?<months>\d+\s?months?)?\s?(?<days>\d+\s?days?)?\s?(?<hours>\d+\s?hours?)?\s?(?<minutes>\d+\s?minutes?)?\s?(?<seconds>\d+\s?seconds?)?/gim;
    const result: RegExpExecArray | null = MOD_DATE_REGEX.exec(string);
    let timeToAdd = 0;

    if (result != null && result.groups != null) {
        if (result.groups.years) {
            const years: number = parseInt(result.groups.years, 10);
            timeToAdd +=
                years *
                MONTHS_IN_YEAR *
                DAYS_IN_MONTH *
                HOURS_IN_DAY *
                MINUTES_IN_HOUR *
                SECONDS_IN_MINUTE;
        }

        if (result.groups.months) {
            const months: number = parseInt(result.groups.months, 10);
            timeToAdd +=
                months *
                DAYS_IN_MONTH *
                HOURS_IN_DAY *
                MINUTES_IN_HOUR *
                SECONDS_IN_MINUTE;
        }

        if (result.groups.days) {
            const days: number = parseInt(result.groups.days, 10);
            timeToAdd +=
                days * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
        }

        if (result.groups.hours) {
            const hours: number = parseInt(result.groups.hours, 10);
            timeToAdd += hours * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
        }

        if (result.groups.minutes) {
            const minutes: number = parseInt(result.groups.minutes, 10);
            timeToAdd += minutes * SECONDS_IN_MINUTE;
        }

        if (result.groups.seconds) {
            const seconds: number = parseInt(result.groups.seconds, 10);
            timeToAdd += seconds;
        }
    }

    if (timeToAdd < 10) {
        timeToAdd = 10;
    }

    return timeToAdd * 1000;
};

/**
 * Get chrono custom in EST
 */
export const getChronoCustom = () => {
    const custom = new chrono.Chrono();
    custom.refiners.push({
        refine: (context, results): ParsingResult[] => {
            results.forEach((result) => {
                result.start.imply('timezoneOffset', -300);
                result.end && result.end.imply('timezoneOffset', -300);
            });
            return results;
        }
    });

    return custom;
}