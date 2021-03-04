import * as winston from 'winston';
import { Loggly } from 'winston-loggly-bulk';

export class LogProcessor {
    static logger: winston.Logger;

    /**
     * Get the singleton instance of AlarmProcessor
     */
    static getLogger(): winston.Logger {
        if (!this.logger) {
            this.logger = winston.createLogger({
                transports: [
                    new Loggly({
                        token: process.env.loggly_token || '',
                        subdomain: process.env.loggly_subdomain || '',
                        tags: ['Winston-NodeJS'],
                        json: true,
                        level: 'debug'
                    }),
                    new winston.transports.Console()
                ]
            });
            this.logger.info('Winston logger setup');
        }

        return this.logger;
    }
}
