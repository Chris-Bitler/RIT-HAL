import {Message, Permissions, TextChannel} from "discord.js";
import {ServerCensors} from "../types/Censor";
import {CensorEntry} from "../models/CensorEntry";
import {LogProcessor} from "./LogProcessor";
import {ConfigProperty} from "../models/ConfigProperty";
import {getInformationalEmbed} from "../utils/EmbedUtil";

/**
 * Processor for censors
 */
export class CensorProcessor {
    static instance: CensorProcessor;
    censors: ServerCensors = {};

    /**
     * Get the singleton instance of AlarmProcessor
     */
    static getInstance(): CensorProcessor {
        if (!this.instance) {
            this.instance = new CensorProcessor();
        }

        return this.instance;
    }

    /**
     * Process a discord message
     * @param message The discord message
     */
    async processMessage(message: Message) {
        if (message.guild && !message.author.bot) {
            const censoredWords = this.censors[message.guild.id];
            if (censoredWords) {
                const messageContent = message.cleanContent.toLowerCase();
                censoredWords.forEach((censoredWord) => {
                    if (censoredWord.includes('%')) {
                        // Replace % with . and create regex
                        const regex = new RegExp(`/${censoredWord.replace('%', '.').replace('_', '\\s')}`,'gi');
                        if (regex.test(messageContent)) {
                            this.handleCensoredWord(message, censoredWord);
                        }
                    } else if (messageContent.includes(censoredWord)) {
                        this.handleCensoredWord(message, censoredWord);
                    }

                });
            }
        }
    }

    /**
     * Handle a detected censored word
     * @param message The discord message triggering the censor
     * @param censoredWord The word that triggered the censor
     */
    async handleCensoredWord(message: Message, censoredWord: string) {
        const sender = message.author;
        if (message.guild) {
            try {
                const dmChannel = await sender.createDM();
                dmChannel.send(getInformationalEmbed(
                    `Your message in ${message.guild.name} was deleted`,
                    "You sent a message with a censored word so it was deleted"
                ))
            } catch (error) {
                LogProcessor.getLogger().error(`Error sending censored message delete to ${message.author.username}`);
            }
            const warningChannelId = await this.fetchWarningChannel(message.guild.id);
            if (warningChannelId) {
                const warningChannel = message.guild.channels.resolve(warningChannelId) as TextChannel;
                if (warningChannel) {
                    await warningChannel.send(getInformationalEmbed(
                        `Deleted censored word from ${message.author.username}`,
                        `User sent ${message.cleanContent} which matched ${censoredWord}`
                    ))
                }
            }
            await message.delete();
        }
    }

    /**
     * Add a censored word to the list
     * @param serverId The server id to add the word to
     * @param word The word to add
     */
    async addCensoredWord(serverId: string, word: string): Promise<boolean> {
        try {
            await CensorEntry.create({
                serverId,
                censoredWord: word.toLowerCase()
            });
            this.createWordArrayIfDoesNotExist(serverId);
            this.censors[serverId].push(word.toLowerCase());
        } catch (error) {
            LogProcessor.getLogger().error(`Error trying to add censored word for ${serverId}: ${error}`);
            return false;
        }

        return true;
    }

    /**
     * Remove a censored word
     * @param serverId
     * @param word
     * @return true if deleted, false otherwise
     */
    async removeCensoredWord(serverId: string, word: string): Promise<boolean> {
        const censor = this.censors[serverId];
        const wordToUse = word.toLowerCase();
        if (censor) {
            const censoredWord = await CensorEntry.findOne({
                where: {
                    serverId,
                    censoredWord: wordToUse
                }
            });
            if (censoredWord) {
                await censoredWord.destroy();
                this.censors[serverId] = censor.filter((censoredWord) => censoredWord !== wordToUse);
                return true;
            }

            return false;
        }

        return false;
    }

    /**
     * Query the list of censored words
     * @param serverId The discord server id
     * @param query The query to query the list with
     */
    queryCensoredWords(serverId: string, query?: string): string[] {
        const censoredWords = this.censors[serverId];
        if (censoredWords) {
            return query ? censoredWords.filter((word) => {
                word.includes(query.toLowerCase())
            }) : censoredWords;
        }

        return [];
    }

    /**
     * Load the initial censored words
     */
    async loadCensoredWords() {
        const entries = await CensorEntry.findAll();
        entries.forEach((entry) => {
            this.createWordArrayIfDoesNotExist(entry.serverId);
            const censor = this.censors[entry.serverId];
            censor.push(entry.censoredWord);
        })
    }

    /**
     * Create the censored word array if it doesn't exist
     * @param serverId The server id
     */
    createWordArrayIfDoesNotExist(serverId: string): void {
        if (!this.censors[serverId]) {
            this.censors[serverId] = [];
        }
    }

    /**
     * Attempt to fetch warning channel
     * @param serverId The guild id to fetch the warning channel
     */
    async fetchWarningChannel(serverId: string): Promise<string | null> {
        const warningChannelId = await ConfigProperty.getServerProperty(
            "censor.warning",
            serverId
        );
        if (warningChannelId?.value) {
            return warningChannelId.value;
        } else {
            return null;
        }
    }
}