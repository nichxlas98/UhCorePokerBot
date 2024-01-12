import { GameState } from "../../enums/States";
import PokerController from "../../poker/PokerController";
import PokerRoom from "../../poker/PokerRoom";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({
    name: "startgame",
    description: "Starts a poker game.",
    options: [
        {
            name: "gameid",
            description: "The ID of the poker game to start.",
            type: 3,
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();
        
        if (!(interaction.member.permissions.has('ADMINISTRATOR'))) {
            return interaction.followUp({ embeds: [ getErrorEmbed("You do not have permission to use this command.") ], ephemeral: true });
        }

        const gameid = interaction.options.getString("gameid");

        const foundTable = PokerController.getInstanceById(gameid);
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('No poker game with that ID was found.') ], ephemeral: true });
        }

        if (foundTable.gameState !== GameState.WAITING) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Poker game has already started/starting.') ], ephemeral: true });
        }

        foundTable.start();
        await interaction.followUp({ embeds: [ getErrorEmbed('Poker game forcefully-started.') ], ephemeral: true });
    },
});