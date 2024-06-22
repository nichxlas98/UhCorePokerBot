import { MessageEmbed, TextChannel } from "discord.js";
import { Command } from "../../structures/Command";
import PokerUser from "../../models/PokerUser";

export default new Command({

    name: "reportissue",
    description: "Report an issue.",
    options: [
        {
            name: "issue",
            description: "Detail the issue/bug in question. (Please be detailed or we'll have to reach out to you!)",
            type: 3,
            required: true
        },
        {
            name: "evidence",
            description: "Include any evidence you have. (Please be detailed or we'll have to reach out to you!)",
            type: 3,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const pokerUser = PokerUser.findUserByUserId(interaction.user.id);
        if (!pokerUser || !pokerUser.verified) {
            return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Error').setDescription('Your account must be verified to report an issue. Contact an administrator directly.') ], ephemeral: true });
        }

        const embed = new MessageEmbed()
            .setTitle('Issue Report')
            .setDescription(`**Reporter**: <@${interaction.user.id}>\n**Username**: ${pokerUser.userName}\n**MA**: ${pokerUser.masterAccount}\n\n**Issue**: ${interaction.options.getString("issue")}\n**Evidence**: ${interaction.options.getString("evidence")}`)
            .setColor(0xFF0000);

        const trackerChannel = interaction.guild?.channels.cache.get('1192565157352718416');
        const issueChannel = interaction.guild?.channels.cache.get('1192636010652246067');

        await (issueChannel as TextChannel)?.send({embeds: [embed]});
        const msg = (trackerChannel as TextChannel)?.send({ embeds: [
            {
                title: 'Bug Tracker',
                description: `A user reported the following: \n\n**Issue**: ${interaction.options.getString("issue")}\n**Evidence**: ${interaction.options.getString("evidence")}\n\nIf you've ran into a similar issue, please react to this message.`,
                color: 0xFF0000
            }
        ]});

        await (await msg).react('✅');

        return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Reported!').setDescription('Thank you for your feedback.') ], ephemeral: true });
    },
});