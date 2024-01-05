import { MessageEmbed } from "discord.js";
import PokerTable from "../../models/PokerTable";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";
import { Logger } from "../../logs/Logger";

export default new Command({
    name: "creategame",
    description: "Create a poker game.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const user = PokerUser.findUserByUserId(interaction.user.id);
        if (!user || !user.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to create a poker game.') ], ephemeral: true });
        }

        const guild = interaction.guild;
        let gameId: string;

        await guild.channels.create(`poker-room-${PokerTable.getTables().length() + 1}`, {
            type: 'GUILD_TEXT',
            permissionOverwrites: [
                {
                  id: guild.roles.everyone.id,
                  deny: ['VIEW_CHANNEL'],
                }]
        }).then(async (channel) => {
            gameId = channel.id;
            await channel.setParent('1191808100609568808');
            await channel.permissionOverwrites.edit(guild.roles.everyone.id, { VIEW_CHANNEL: false });
            new PokerTable(gameId, channel);
        });

        Logger.getInstance().log(`Poker game created: ${gameId} by ${user.userName}`, 1);
        return interaction.followUp({ content: 'Poker game created! Join using ID: ' + gameId, ephemeral: true });
    },
});