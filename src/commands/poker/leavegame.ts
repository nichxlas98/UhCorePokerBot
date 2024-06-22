import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";
import PokerController from "../../poker/PokerController";

export default new Command({
    name: "leavegame",
    description: "Leave a poker game.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const user = PokerUser.findUserByUserId(interaction.user.id);
        if (!user || !user.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to leave a poker game.') ], ephemeral: true });
        }

        const foundTable = PokerController.getRooms().find(table => table.joined.contains(user.userName));
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are not in a poker game.') ], ephemeral: true });
        }

        foundTable.leave(user.userName);
    },
});