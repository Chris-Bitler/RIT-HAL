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

interface DateMatches {
    years: number | null,
    months: number | null,
    days: number | null,
    hours: number | null,
    minutes: number | null,
    seconds: number | null
}
const SECONDS_IN_MINUTE: number = 60;
const MINUTES_IN_HOUR: number = 60;
const HOURS_IN_DAY: number = 24;
const DAYS_IN_MONTH: number = 31;
const MONTHS_IN_YEAR: number = 12;

export const parseModDateString = (string: string): number => {
    const MOD_DATE_REGEX: RegExp = /(?<years>\d+\s?years?)?(?<months>\d+\s?months?)?(?<days>\d+\s?days?)?(?<hours>\d+\s?hours?)?(?<minutes>\d+\s?minutes?)?(?<seconds>\d+\s?seconds?)?/gi;
    const result: RegExpExecArray|null = MOD_DATE_REGEX.exec(string);
    let timeToAdd = 0;

    if (result != null && result.groups != null) {
        if (result.groups.years) {
            const years: number = parseInt(result.groups.years, 10);
            timeToAdd += (years * MONTHS_IN_YEAR * DAYS_IN_MONTH * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
        }

        if (result.groups.months) {
            const months: number = parseInt(result.groups.months, 10);
            timeToAdd += (months * DAYS_IN_MONTH * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
        }

        if (result.groups.days) {
            const days: number = parseInt(result.groups.days, 10);
            timeToAdd += (days * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
        }

        if (result.groups.hours) {
            const hours: number = parseInt(result.groups.hours, 10);
            timeToAdd += (hours * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
        }

        if (result.groups.minutes) {
            const minutes: number = parseInt(result.groups.minutes, 10);
            timeToAdd += (minutes * SECONDS_IN_MINUTE);
        }

        if (result.groups.seconds) {
            const seconds: number = parseInt(result.groups.seconds, 10);
            timeToAdd += (seconds);
        }
    }

    if (timeToAdd < 10) {
        timeToAdd = 10;
    }

    return timeToAdd * 1000;
};