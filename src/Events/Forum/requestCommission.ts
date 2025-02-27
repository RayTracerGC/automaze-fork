import {
    Colors,
    DiscordAPIError,
    EmbedBuilder,
    Events,
    MessageCreateOptions,
    ThreadChannel,
    roleMention,
    userMention,
} from 'discord.js';
import IEventData from '../../Interfaces/Events';
import ExtendedClient from '../../Core/extendedClient';
import { createEmbed, DiscordErrorCodes } from '../../Utils/discordUtilities';
import { delay } from '../../Utils/generalUtilities';
import { isAskingForGirlModel, sendErrorLog } from '../../Utils/botUtilities';
import knexInstance from '../../db';
import ModelService from '../../Services/modelService';

async function handleFreeRequest(client: ExtendedClient, thread: ThreadChannel): Promise<void> {
    // latina E-Girl
    const stickerId = '1159469403843346443';

    try {
        const threadTitle = thread.name.toLowerCase();
        const response: MessageCreateOptions = {};

        if (isAskingForGirlModel(threadTitle)) {
            response.stickers = [stickerId];
        } else {
            response.embeds = [
                createEmbed({
                    color: Colors.Blurple,
                    title: '💡 Tip',
                    description: [
                        'You can check if someone already made this model. Try the following:',
                        '- Search for it in <#1175430844685484042>',
                        '- Alternatively, in <#1163592055830880266>:',
                        '    - Send " <@1144714449563955302> search (name of the model)", without the ()',
                        '  - Use the command `/find` with <@1138318590760718416> bot',
                        '- Visit <https://weights.gg/> and search for the model (login required)',
                    ],
                }),
            ];
        }
        await thread.send(response);
    } catch (error) {
        if (error instanceof DiscordAPIError) {
            if (
                error.code === DiscordErrorCodes.CannotUseThisSticker ||
                error.code === DiscordErrorCodes.InvalidFormBody
            ) {
                client.logger.warn(`Couldn't find sticker with id ${stickerId}`);
            } else {
                client.logger.error('Unexpected error handling free model request', error);
            }
        }
    } finally {
        const service = new ModelService(knexInstance);

        const starterMessage = await thread.fetchStarterMessage();
        const description = starterMessage ? starterMessage.content : '';

        await service.create({
            id: thread.id,
            parent_id: thread.parentId ?? '',
            author_id: thread.ownerId ?? '',
            title: thread.name,
            is_request: true,
            description,
        });
    }
}

async function handlePaidRequest(client: ExtendedClient, thread: ThreadChannel): Promise<void> {
    const modelMasterRoleId = client.discordIDs.Roles['ModelMaster'];

    const embeds: EmbedBuilder[] = [];

    if (thread.ownerId) {
        embeds.push(
            createEmbed({
                color: Colors.Aqua,
                description: [
                    `Hello, ${userMention(thread.ownerId)}!`,
                    '\nPeople will contact you to offer their services. However, if you created a **paid** request by mistake or if someone already finished your request, use the `/close` command to archive this post.',
                ],
            })
        );
    }

    embeds.push(
        createEmbed({
            color: Colors.Blue,
            description: [
                '\n**Some general recommendations regarding commissions:**',
                "- Don't rush! You'll receive many requests, so take your time to review the best offer. The first person who contacts you may not always be the best option.",
                `- We recommend exclusively accepting commission from people holding the ${roleMention(modelMasterRoleId)} role, regardless of any role above it when accepting commissions to ensure a secure and qualified working relationship.`,
            ],
        })
    );

    if (client.botConfigs.commissions.deleteMessages) {
        embeds.push(
            createEmbed({
                title: '⚠️ Warning to model makers',
                color: Colors.Yellow,
                description: [
                    `> Make sure you have the ${roleMention(modelMasterRoleId)} role, or your response might be deleted.`,
                ],
            })
        );
    }

    await thread.send({ embeds: embeds });
}

const RequestComission: IEventData = {
    name: Events.ThreadCreate,
    once: false,
    async run(client, thread: ThreadChannel, newlyCreated: boolean) {
        // check if it's a Request Forum
        if (!newlyCreated) return;
        if (thread.guildId != client.discordIDs.Guild) return;
        if (thread.parentId != client.discordIDs.Forum.RequestModel.ID) return;

        // check if the thread was created successfully
        await delay(10_000);
        if (!thread.guild.channels.cache.get(thread.id)) return;

        const { botConfigs } = client;

        // quit if configuration doesn't allow bot to send messages
        if (!botConfigs.commissions.sendMessages) return;

        try {
            // check if it's a free or paid request
            const isPaidRequest = Boolean(
                thread.appliedTags.find((tag) => tag == client.discordIDs.Forum.RequestModel.Tags.Paid)
            );
            const isFreeRequest = Boolean(
                thread.appliedTags.find((tag) => tag == client.discordIDs.Forum.RequestModel.Tags.Free)
            );

            if (isPaidRequest && isFreeRequest) {
                await handlePaidRequest(client, thread);
            } else if (isPaidRequest) {
                await handlePaidRequest(client, thread);
            } else if (isFreeRequest) {
                await handleFreeRequest(client, thread);
            }
        } catch (error) {
            await sendErrorLog(client, error, {
                command: `Event: ThreadCreate`,
                message: 'Failure on model request',
                guildId: thread.guildId ?? '',
                channelId: thread.id,
            });
        }
    },
};

export default RequestComission;
