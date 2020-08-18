import {Command} from "./Command";
import {Client, Message, Permissions} from "discord.js";
import {SendEmbedStateMachine} from "../stateMachines/SendEmbedStateMachine";

export class SendEmbed extends Command {
    async useCommand(client: Client, evt: Message, args: string[]): Promise<void> {
        SendEmbedStateMachine.getInstance().firstStep(client, evt);
    }

    getCommand(): string[] {
        return ["sendEmbed", "se"]
    }

    getRequiredPermission(): number {
        return Permissions.FLAGS.ADMINISTRATOR;
    }
}