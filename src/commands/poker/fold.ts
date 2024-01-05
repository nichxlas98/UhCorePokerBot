import { PlayerAction, PlayerState } from "../../enums/States";
import PokerTable from "../../models/PokerTable";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({
    name: "fold",
    description: "Fold a poker game.",
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
            return interaction.followUp({ embeds: [ getErrorEmbed('It is not your turn to fold.') ], ephemeral: true });
        }

        pokerPlayer.lastAction = PlayerAction.FOLD;
        pokerPlayer.playerState = PlayerState.FOLDED;
        pokerPlayer.actions++;
        
        foundTable.postChat(`**[GAME]** **${user.userName}** folded.`);
        foundTable.checkIfAllPlayersFoldedOrQuit(pokerPlayer);
    },
});