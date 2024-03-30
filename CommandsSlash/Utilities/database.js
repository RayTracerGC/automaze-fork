const {
    SlashCommandBuilder,
    AttachmentBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType } = require('discord.js');
const { byValue, byNumber } = require('sort-es');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const delay = require('node:timers/promises').setTimeout;

module.exports = {
    category: 'Utilities',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('database')
        .setDescription('Manages bot database data')
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('manage')
                .setDescription('Import/Export data')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('import')
                        .setDescription('Imports data to database')
                        .addAttachmentOption(option =>
                            option
                                .setName('file')
                                .setDescription('The JSON file containing the data')
                                .setRequired(true),
                        ),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('export')
                        .setDescription('Downloads the bot data as a JSON file'),
                ),
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('users')
                .setDescription('CRUD operations for user database')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('create')
                        .setDescription('Create a new user in database')
                        .addStringOption(option =>
                            option
                                .setName('user_id')
                                .setDescription('Discord ID')
                                .setMaxLength(20)
                                .setMinLength(16)
                                .setRequired(true))
                        .addStringOption(option =>
                            option
                                .setName('user_name')
                                .setDescription('Username')
                                .setRequired(true)),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('read')
                        .setDescription('Retrieve a user from database')
                        .addStringOption(option =>
                            option
                                .setName('user_id')
                                .setDescription('Discord ID')
                                .setRequired(true)),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('update')
                        .setDescription('Update a user in database')
                        .addStringOption(option =>
                            option
                                .setName('user_id')
                                .setDescription('Discord ID')
                                .setRequired(true))
                        .addStringOption(option =>
                            option
                                .setName('username')
                                .setDescription('Username'))
                        .addStringOption(option =>
                            option
                                .setName('display_name')
                                .setDescription('Display name'))
                        .addIntegerOption(option =>
                            option
                                .setName('bananas')
                                .setDescription('Banana count')
                                .setMinValue(0)),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('delete')
                        .setDescription('Delete a user from database')
                        .addStringOption(option =>
                            option
                                .setName('user_id')
                                .setDescription('Discord ID')
                                .setRequired(true)),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('get_all')
                        .setDescription('Retrieve all users from database'),
                ),
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        await delay(1000);

        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const { client } = interaction;

        if (subcommandGroup === 'manage') {
            if (subcommand === 'import') {
                const file = interaction.options.getAttachment('file');

                if (file.contentType.includes('application/json')) {
                    try {
                        const response = await fetch(file.url);

                        if (response.ok) {
                            const data = await response.json();

                            for (const record of data) {
                                const dataToInsert = {
                                    'user_id': record.user_id,
                                    'item_id': 1, // banana item id
                                    quantity: record.bananaCount,
                                };
                                await client.knexInstance('inventory').insert(dataToInsert);
                                await client.knexInstance('user').insert({
                                    id: record.user_id,
                                    username: record.userName,
                                });
                            }
                            await interaction.editReply({ content: 'JSON data updated!' });
                        }
                        else {
                            await interaction.editReply({ content: 'Failed to fetch JSON' });
                        }
                    }
                    catch (error) {
                        await interaction.editReply({ content: `Invalid JSON:\n> ${error.message}` });
                    }
                }
                else {
                    await interaction.editReply({ content: 'Not a JSON file' });
                }
            }
            else if (subcommand === 'export') {
                const jsonData = [];
                const inventory = await client.knexInstance('inventory').orderBy('quantity', 'desc');

                if (inventory.length === 0) {
                    return await interaction.editReply({ content: 'The leaderboard is empty.' });
                }

                for (const entry of inventory) {
                    const user = await client.knexInstance('user').where('id', entry['user_id']);
                    jsonData.push({
                        user_id: user[0].id,
                        userName: user[0].username,
                        bananaCount: entry.quantity,
                    });
                }

                const data = JSON.stringify(jsonData);
                const buffer = Buffer.from(data, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: 'database.json' });
                await interaction.editReply({ files: [attachment] });
            }

        }
        else if (subcommandGroup === 'users') {
            const userId = interaction.options.getString('user_id');
            let User;

            if (subcommand === 'create') {
                const userName = interaction.options.getString('user_name').toLowerCase();
                User = await client.knexInstance('user').where('id', userId).first();
                if (!User) {
                    await client.knexInstance('user').insert({
                        id: userId,
                        username: userName,
                    });
                    return await interaction.editReply({ content: `User ${userId} added.` });
                }
                await interaction.editReply({ content: 'That user is already in database.' });
            }
            else if (subcommand === 'read') {
                User = await client.knexInstance('user').where('id', userId).first();

                if (!User) {
                    return await interaction.editReply({ content: 'User not found.' });
                }

                const embedDescription = [
                    `- **ID**: ${User.id}`,
                    `- **Username**: ${User.username}`,
                    `- **Display**: ${User.display_name ?? 'N/A'}`,
                ];

                const embed = new EmbedBuilder()
                    .setTitle('User')
                    .setDescription(embedDescription.join('\n'))
                    .setColor('Blurple');
                await interaction.editReply({ embeds: [embed] });
            }
            else if (subcommand === 'update') {
                User = await client.knexInstance('user').where('id', userId).first();

                if (!User) {
                    return await interaction.editReply({ content: 'User not found.' });
                }

                const displayName = interaction.options.getString('display_name');
                const userName = interaction.options.getString('user_name');
                const bananas = interaction.options.getInteger('bananas');

                const dataToUpdate = {};

                if (userName) {
                    dataToUpdate['username'] = userName;
                }

                if (displayName) {
                    dataToUpdate['display_name'] = displayName;
                }

                if (Object.keys(dataToUpdate).length === 0) {
                    return await interaction.editReply({ content: 'Nothing changed.' });
                }

                await client.knexInstance('user').where('id', userId).update(dataToUpdate);
                await interaction.editReply({ content: `User ${userId} updated.` });
            }
            else if (subcommand === 'delete') {
                User = await client.knexInstance('user').where('id', userId).first();

                if (!User) {
                    return await interaction.editReply({ content: 'User not found.' });
                }

                await client.knexInstance('user').where('id', userId).del();

                await interaction.editReply({ content: `User ${userId} deleted.` });
            }
            else if (subcommand === 'get_all') {

                const users = await client.knexInstance.select('*').from('user');

                const embedDescription = users.map((user) => `- ${user.id}: ${user.username}`);

                const itemsPerPage = 10;
                const pages = Math.ceil(embedDescription.length / itemsPerPage);
                let currentPage = 1;

                const getEmbed = (page) => {
                    const startIndex = (page - 1) * itemsPerPage;
                    const endIndex = Math.min(page * itemsPerPage, embedDescription.length);
                    const listedItems = embedDescription.slice(startIndex, endIndex);

                    const embed = new EmbedBuilder()
                        .setTitle('Users')
                        .setDescription(listedItems.join('\n'))
                        .setColor('Blurple')
                        .setFooter({ text: `Page ${currentPage} of ${pages}` });

                    const row = new ActionRowBuilder();

                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 1),
                    );

                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === pages),
                    );

                    return { embeds: [embed], components: [row] };
                };

                const response = await interaction.editReply(getEmbed(currentPage));
                const interactionDuration = 60_000;

                const collector = response.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: interactionDuration,
                });

                collector.on('collect', async (buttonInteraction) => {
                    if (!buttonInteraction.isButton()) return;
                    await buttonInteraction.deferUpdate();

                    if (buttonInteraction.customId === 'previous') {
                        currentPage--;
                    }
                    else if (buttonInteraction.customId === 'next') {
                        currentPage++;
                    }

                    await buttonInteraction.editReply(getEmbed(currentPage));

                    // Reset timeout on interaction
                    collector.resetTimer();
                });

                collector.on('end', async () => {
                    const embed = new EmbedBuilder()
                        .setTitle('Users')
                        .setDescription('Interaction timed out.')
                        .setColor('Red');
                    await interaction.editReply({ embeds: [embed], components: [] });
                });
            }
        }
    },
};