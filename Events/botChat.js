const delay = require('node:timers/promises').setTimeout;

module.exports = {
    name: "messageCreate",
    once: false,
    async run(client, message, _) {
        // only proceed if feture is enabled in configs
        if (!client.botConfigs.general.chat) return;

        if (message.author.bot) return;

        // skip prefix commands
        const prefix = client.prefix.ensure(message.guild.id, '-');
        if (message.content.startsWith(prefix)) return;

        const messageLowercase = message.content.toLowerCase();

        const { botResponses, botUtils } = client;

        const questions = botResponses.botChat.en;
        let selectedAnswer = null;

        for (const msg of questions) {
            if (msg.prompts.includes(messageLowercase)) {
                const responseTypes = ['positive', 'negative'];
                if (botUtils.getRandomFromArray(responseTypes) === 'positive') {
                    selectedAnswer = botUtils.getRandomFromArray(msg.answers.positive);
                }
                else {
                    selectedAnswer = botUtils.getRandomFromArray(msg.answers.negative);
                }

                await message.reply(selectedAnswer);
            }  
        }
    }
}
