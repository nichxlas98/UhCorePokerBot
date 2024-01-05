import { PlayerAction } from "../../enums/States";
import PokerTable from "../../models/PokerTable";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({
    name: "call",
    description: "Call a player.",
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
            return interaction.followUp({ embeds: [ getErrorEmbed('It is not your turn to call.') ], ephemeral: true });
        }

        if (foundTable.winningPool <= 0) {
            return interaction.followUp({ embeds: [ getErrorEmbed('A starting bet must be placed before you can call.') ], ephemeral: true });
        }

        if (pokerPlayer.cash <= foundTable.lastBet) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You cannot call more than, or all you have. You can only go all-in, or fold.') ], ephemeral: true });
        }

        pokerPlayer.cash -= foundTable.lastBet;
        pokerPlayer.currentBet = foundTable.lastBet;
        pokerPlayer.lastAction = PlayerAction.CALL;
        pokerPlayer.actions++;

        foundTable.winningPool += foundTable.lastBet;

        foundTable.postChat(`**[GAME]** **${user.userName}** called.`);
        foundTable.nextPlayerTurn(pokerPlayer);
    },
});