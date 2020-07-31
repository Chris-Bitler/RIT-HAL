const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_MONTH = 31;
const MONTHS_IN_YEAR = 12;

const parseModDateString = (string) => {
    const MOD_DATE_REGEX = /(?<years>\d+\s?years?)?(?<months>\d+\s?months?)?(?<days>\d+\s?days?)?(?<hours>\d+\s?hours?)?(?<minutes>\d+\s?minutes?)?(?<seconds>\d+\s?seconds?)?/gi;
    const result = MOD_DATE_REGEX.exec(string);
    let timeToAdd = 0;

    if (result.groups.years) {
        const years = parseInt(result.groups.years, 10);
        timeToAdd += (years * MONTHS_IN_YEAR * DAYS_IN_MONTH * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
    }

    if (result.groups.months) {
        const months = parseInt(result.groups.months, 10);
        timeToAdd += (months * DAYS_IN_MONTH * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
    }

    if (result.groups.days) {
        const days = parseInt(result.groups.days, 10);
        timeToAdd += (days * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
    }

    if (result.groups.hours) {
        const hours = parseInt(result.groups.hours, 10);
        timeToAdd += (hours * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
    }

    if (result.groups.minutes) {
        const minutes = parseInt(result.groups.minutes, 10);
        timeToAdd += (minutes * SECONDS_IN_MINUTE);
    }

    if (result.groups.seconds) {
        const seconds = parseInt(result.groups.seconds, 10);
        timeToAdd += (seconds);
    }

    if (timeToAdd < 10) {
        timeToAdd = 10;
    }

    return timeToAdd * 1000;
};

module.exports = {
    parseModDateString
};