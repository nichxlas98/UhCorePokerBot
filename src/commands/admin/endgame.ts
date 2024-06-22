import PokerController from "../../poker/PokerController";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({

    name: "endgame",
    description: "Ends the current poker game.",
    options: [
        {
            name: "gameid",
            description: "The ID of the poker game to end.",
            type: 3,
            required: true
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

        await interaction.followUp({ embeds: [ getErrorEmbed('Poker game forcefully-ended.') ], ephemeral: true }); 
        await PokerController.deleteRoom(foundTable);
    },  
});