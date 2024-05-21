"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
function createEmbeds(guides) {
    const embeds = [];
    for (const guide of guides) {
        for (const data of guide.embeds) {
            const embed = new discord_js_1.EmbedBuilder().setTitle(data.title);
            if (data.fields) {
                embed.setFields(data.fields);
            }
            if (data.color) {
                embed.setColor(data.color);
            }
            if (data.description) {
                embed.setDescription(data.description.join('\n'));
            }
            if (data.footer) {
                embed.setFooter({ text: data.footer });
            }
            embeds.push(embed);
        }
    }
    return embeds;
}
const SendRealtimeGuides = {
    category: 'Tags',
    type: 'context-menu',
    data: new discord_js_1.ContextMenuCommandBuilder()
        .setName('Send Realtime guides')
        .setType(discord_js_1.ApplicationCommandType.User),
    async execute(interaction) {
        const { targetUser } = interaction;
        const client = interaction.client;
        if (targetUser.bot)
            return await interaction.reply({ content: 'That user is a bot.', ephemeral: true });
        const { botData } = client;
        const embedData = botData.embeds.realtime.en;
        const guides = [];
        if (embedData.local) {
            guides.push(embedData.local);
        }
        if (embedData.online) {
            guides.push(embedData.online);
        }
        if (embedData.faq) {
            guides.push(embedData.faq);
        }
        interaction.reply({ content: `Suggestions for ${targetUser}`, embeds: createEmbeds(guides) });
    }
};
exports.default = SendRealtimeGuides;
