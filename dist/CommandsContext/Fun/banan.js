"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* context menu version of /banana */
const discord_js_1 = require("discord.js");
const { banan } = require('../../utils.js');
const Banan = {
    category: 'Fun',
    type: 'context-menu',
    data: new discord_js_1.ContextMenuCommandBuilder()
        .setName('banan')
        .setType(discord_js_1.ApplicationCommandType.User),
    async execute(interaction) {
        const client = interaction.client;
        const targetUser = interaction.targetUser;
        let guildMember = interaction.guild?.members.cache.get(targetUser.id);
        if (!guildMember) {
            client.logger.debug(`Guild member ${targetUser.id} not found in cache...Fetching`);
            guildMember = await interaction.guild?.members.fetch(targetUser.id);
        }
        await banan(interaction, targetUser, guildMember);
    }
};
exports.default = Banan;
