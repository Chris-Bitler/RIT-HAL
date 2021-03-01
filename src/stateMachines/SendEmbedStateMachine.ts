import { Client, Message, MessageEmbed, TextChannel } from 'discord.js';

interface SendEmbedContext {
    client: Client;
    lastMessage: Message;
}

interface Result {
    title?: string;
    description?: string;
    imageUrl?: string;
}

// Steps
// Initial step to prompt the user
const setupStep: Step<SendEmbedContext, Result> = (
    context: SendEmbedContext
) => {
    context.lastMessage.channel.send(
        'What do you want the embed title to be? (Say stop at any time to exit this process)'
    );
    return [{}, parseTitleStep];
};

// Parse the title input and ask for description
const parseTitleStep: Step<SendEmbedContext, Result> = (
    context: SendEmbedContext
) => {
    context.lastMessage.channel.send('What do you want the description to be?');
    return [{ title: context.lastMessage.content }, parseDescriptionStep];
};

// Parse the description input and ask if an image should be added
const parseDescriptionStep: Step<SendEmbedContext, Result> = (
    context,
    result
) => {
    context.lastMessage.channel.send(
        'Do you want to send an image? (no for no image)'
    );
    return [
        {
            title: result?.title,
            description: context.lastMessage.content
        },
        parseImageStep
    ];
};

// Parse the image and ask what channel it should be sent in
const parseImageStep: Step<SendEmbedContext, Result> = (context, result) => {
    context.lastMessage.channel.send('What channel should the embed be in?');
    const useImage = context.lastMessage.content.toLowerCase() !== 'no';
    return [
        {
            title: result?.title,
            description: result?.description,
            imageUrl: useImage ? context.lastMessage.content : undefined
        },
        parseChannelAndSendStep
    ];
};

// Parse the channel and send it
const parseChannelAndSendStep: Step<SendEmbedContext, Result> = (
    context,
    result
) => {
    const channel = context.lastMessage.content.replace(/[#<>]+/g, '');
    const embed = new MessageEmbed()
        .setTitle(result?.title)
        .setDescription(result?.description)
        .setImage(result?.imageUrl ? result?.imageUrl : '');
    (context.lastMessage.guild?.channels.resolve(channel) as TextChannel).send(
        embed
    );
    return [result ?? {}];
};

/**
 * Manage the step that the user is on in the send embed process
 */
export class SendEmbedStateMachine {
    static instance: SendEmbedStateMachine;
    private steps: Map<
        string,
        [Result, Step<SendEmbedContext, Result>]
    > = new Map();

    static getInstance(): SendEmbedStateMachine {
        if (!this.instance) {
            this.instance = new SendEmbedStateMachine();
        }

        return this.instance;
    }

    /**
     * Initial setup step
     * @param client
     * @param message
     */
    firstStep(client: Client, message: Message): void {
        const step = this.steps.get(message.author.id);
        if (!step) {
            const context = {
                client,
                lastMessage: message
            };
            const [result, nextStep] = setupStep(context);
            if (nextStep) {
                this.steps.set(message.author.id, [result, nextStep]);
            }
        }
    }

    /**
     * Handle steps after the first one.
     * @param client
     * @param message
     */
    handleStep(client: Client, message: Message): void {
        const step = this.steps.get(message.author.id);
        const context = {
            client,
            lastMessage: message
        };
        if (message.content.toLowerCase() !== 'stop') {
            if (step) {
                const [result, nextStep] = step;
                const [nextStepResult, futureStep] = nextStep(context, result);
                if (futureStep) {
                    this.steps.set(message.author.id, [
                        nextStepResult,
                        futureStep
                    ]);
                } else {
                    this.steps.delete(message.author.id);
                }
            }
        } else {
            this.steps.delete(message.author.id);
        }
    }
}
