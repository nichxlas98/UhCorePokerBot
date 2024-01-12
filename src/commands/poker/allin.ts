import { GameState, PlayerAction } from "../../enums/States";
import PokerRoom from "../../poker/PokerRoom";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";
import PokerController from "../../poker/PokerController";

export default new Command({
    name: "allin",
    description: "All in a poker game.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();
        
        const user = PokerUser.findUserByUserId(interaction.user.id);
        if (!user || !user.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to call.') ], ephemeral: true });
        }

        const foundTable = PokerController.getRooms().find(table => table.joined.contains(user.userName));
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are not in a poker game.') ], ephemeral: true });
        }

        const pokerPlayer = foundTable.players.find(player => player.username === user.userName);
        if (!pokerPlayer || foundTable.gameState === GameState.STARTING) {
            return interaction.followUp({ embeds: [ getErrorEmbed("The game hasn't started yet.") ], ephemeral: true });
        }

        if (!pokerPlayer.isPlayersTurn) {
            return interaction.followUp({ embeds: [ getErrorEmbed('It is not your turn to go all-in.') ], ephemeral: true });
        }

        if (foundTable.winningPool <= 0) {
            return interaction.followUp({ embeds: [ getErrorEmbed('A starting bet must be placed before you can go all-in.') ], ephemeral: true });
        }

        pokerPlayer.currentBet = pokerPlayer.cash;
        foundTable.winningPool += pokerPlayer.cash;
        foundTable.lastBet = pokerPlayer.cash;
        pokerPlayer.cash = 0;
        pokerPlayer.actions++;

        pokerPlayer.lastAction = PlayerAction.ALL_IN;

        await foundTable.chatManager.postChat(`**[GAME]** **${user.userName}** went all-in.`);
        foundTable.nextTurn(pokerPlayer);
    },
});