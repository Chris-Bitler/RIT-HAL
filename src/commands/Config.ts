import { Command } from "./Command";
import { Client, Message, Permissions } from "discord.js";
import { mergeArgs } from "../utils/StringUtil";
import { ConfigProperty } from "../models/ConfigProperty";
import { getErrorEmbed, getInformationalEmbed } from "../utils/EmbedUtil";

/**
 * Command to manage server config in the interim until the web panel is made
 */
export class Config extends Command {
    async useCommand(
        client: Client,
        evt: Message,
        args: string[]
    ): Promise<void> {
        if (args.length >= 2) {
            const key = args[0];
            const value = mergeArgs(1, args);
            const serverId = evt.guild?.id;
            if (serverId) {
                const [
                    configProperty,
                    created
                ] = await ConfigProperty.findOrCreate({
                    where: {
                        serverId,
                        key
                    },
                    defaults: {
                        serverId,
                        key,
                        value
                    }
                });
                if (created) {
                    evt.channel.send(
                        getInformationalEmbed(
                            "Value created",
                            `${configProperty.key} was created and set to ${configProperty.value}`
                        )
                    );
                } else {
                    ConfigProperty.update(
                        {
                            value
                        },
                        {
                            where: {
                                serverId,
                                key
                            }
                        }
                    );
                    evt.channel.send(
                        getInformationalEmbed(
                            "Value updated",
                            `${configProperty.key} was updated to ${value}`
                        )
                    );
                }
            } else {
                evt.channel.send(
                    getErrorEmbed("Cannot resolve server to set config for")
                );
            }
        } else {
            evt.channel.send(
                getErrorEmbed("Not enough arguments. Try `-config [key] [value]`")
            )
        }
    }

    getCommand(): string {
        return "config";
    }

    getConfigBase(): string {
        return "config";
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.ADMINISTRATOR;
    }
}
