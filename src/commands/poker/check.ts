import { PlayerAction } from "../../enums/States";
import PokerTable from "../../models/PokerTable";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({
    name: "check",
    description: "Check the current bet.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const user = PokerUser.findUserByUserId(interaction.user.id);
        if (!user || !user.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to call.') ], ephemeral: true });
        }

        const foundTable = PokerTable.getTables().find(table => table.joined.contains(user.userName));
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are not in a poker game.') ], ephemeral: true });
        }

        const pokerPlayer = foundTable.players.find(player => player.username === user.userName);
        if (!pokerPlayer) {
            return interaction.followUp({ embeds: [ getErrorEmbed("The game hasn't started yet.") ], ephemeral: true });
        }

        if (!pokerPlayer.isPlayersTurn) {
            return interaction.followUp({ embeds: [ getErrorEmbed('It is not your turn to check.') ], ephemeral: true });
        }

        if (foundTable.winningPool <= 0) {
            return interaction.followUp({ embeds: [ getErrorEmbed('A starting bet must be placed before you can check.') ], ephemeral: true });
        }

        if (pokerPlayer.index > 0 && foundTable.players.get(pokerPlayer.index - 1).lastAction !== PlayerAction.CHECK) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You cannot check if the other player made a bet.') ], ephemeral: true });
        }

        pokerPlayer.lastAction = PlayerAction.CHECK;
        pokerPlayer.actions++;

        foundTable.postChat(`**[GAME]** **${user.userName}** checked.`);
        foundTable.nextPlayerTurn(pokerPlayer);
    },
});