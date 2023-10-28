const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    category: 'Info',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('guides')
        .setDescription('Guides for RVC (how to make ai cover).')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Choose a category')
                .setRequired(true)
                .addChoices(
                    { name: 'RVC', value: 'rvc' },
                    { name: 'Audio', value: 'audio' },
                    { name: 'Colab', value: 'colab' },
                    { name: 'Paperspace', value: 'paperspace' },
                    { name: 'Realtime', value: 'realtime' },
                    { name: 'Upload', value: 'upload' },
                )
        )
        .addStringOption(option =>
            option.setName('language')
                .setDescription('(Optional) Choose a language by country')
                .addChoices(
                    { name: 'EN', value: 'en' },
                )
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('(Optional) Send this guide to an user')
        )
    ,
    async execute(interaction) {
        const category = interaction.options.getString('category');
        const language = interaction.options.getString('language');
        const targetUser = interaction.options.getUser('user');

        const client = interaction.client;

        // default response
        let botResponse = { content: 'Will be available soon, stay tuned!', ephemeral: true };

        switch (category) {
            case 'audio':
                botResponse.content = '';
                botResponse.embeds = [
                    client.botUtils.createEmbed(client.botData.embeds.audio.en.guides, client.botConfigs.colors.theme.primary),
                    client.botUtils.createEmbed(client.botData.embeds.audio.en.tools, client.botConfigs.colors.theme.secondary)
                ];
                botResponse.ephemeral = false;
                break;
            case 'colab':
                botResponse.content = '## Google Colabs';
                botResponse.embeds = [
                    client.botUtils.createEmbed(client.botData.embeds.colab.en.rvc, client.botConfigs.colors.theme.primary),
                    client.botUtils.createEmbed(client.botData.embeds.colab.en.uvr, client.botConfigs.colors.theme.secondary)
                ];
                botResponse.ephemeral = false;
                break;
            case 'paperspace':
                const button = new ButtonBuilder()
                    .setLabel('Google Docs')
                    .setURL('https://docs.google.com/document/d/1lIAK4Y0ylash_1M2UTTL_tfA3_mEzP0D2kjX2A3rfSY/edit?usp=sharing')
                    .setStyle(ButtonStyle.Link);

                const actionRow = new ActionRowBuilder()
                    .addComponents(button);

                botResponse.content = '';
                botResponse.embeds = [
                    client.botUtils.createEmbed(client.botData.embeds.paperspace, client.botConfigs.colors.theme.primary)
                ];
                botResponse.ephemeral = false;
                botResponse.components = [actionRow];
                break;
            case 'realtime':
                const targetChannelId = client.discordIDs.Channel.HelpWOkada;
                const targetChannel = interaction.guild.channels.cache.get(targetChannelId) ?? '"help-w-okada" channel';

                const embedData = client.botData.embeds.realtime.en;
                embedData.color = client.botConfigs.colors.theme.primary;

                // insert the link to the channel in $channel
                const lastDescriptionIndex = embedData.description.length - 1;
                const lastDescriptionText = embedData.description[lastDescriptionIndex]
                embedData.description[lastDescriptionIndex] = lastDescriptionText.replace('$channel', targetChannel);

                // create bot response
                botResponse.content = '';
                botResponse.embeds = [ client.botUtils.createEmbed(embedData) ];
                botResponse.ephemeral = false;
                break;
            case 'upload':
                botResponse.content = '';
                botResponse.embeds = [client.botUtils.createEmbed(client.botData.embeds.upload, client.botConfigs.colors.theme.primary)];
                botResponse.ephemeral = false;
                break;
            default:
                botResponse.content = '### RVC Guides (How to Make AI Cover)';
                botResponse.embeds = [client.botUtils.createEmbed(client.botData.embeds.rvc.main, client.botConfigs.colors.theme.primary)];
                botResponse.ephemeral = false;
        }

        if (targetUser && (targetUser.id !== interaction.user.id)) {
            // if try to send the guide to the bot...
            if (targetUser.id === client.user.id) {
                const bloopers = [
                    'bruh i know how to make ai cover',
                    'thanks i\'ll check',
                    'alright, thanks!',
                    'thanks for the guide suggestion',
                    'yeah imma read it, thanks!',
                    'okay, thanks for the suggestion!'
                ];
                return await interaction.reply(bloopers[client.botUtils.getRandomNumber(0, bloopers.length)]);
            }
            botResponse.content += `\n👇 Suggestions for ${targetUser}!`;
            return await interaction.reply(botResponse);
        }

        await interaction.reply(botResponse);
    }
};