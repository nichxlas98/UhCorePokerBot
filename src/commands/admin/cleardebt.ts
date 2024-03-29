import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({

    name: "cleardebt",
    description: "Clears the debt of a user.",
    options: [
        {
            name: "user",
            description: "The user to clear the debt of.",
            type: 6,
            required: true
        },
        {
            name: "debt",
            description: "Set a user's debt.",
            type: 4,
            required: false
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();
        if (!(interaction.member.permissions.has('ADMINISTRATOR'))) {
            return interaction.followUp({ embeds: [ getErrorEmbed("You do not have permission to use this command.") ], ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        if (!user) {
            return interaction.followUp({ embeds: [ getErrorEmbed("User not found.") ], ephemeral: true });
        }

        const foundUser = PokerUser.findUserByUserId(user.id);
        if (!foundUser) {
            return interaction.followUp({ embeds: [ getErrorEmbed(`${user.tag} has never played poker.`) ], ephemeral: true });
        }

        const debt = interaction.options.getNumber("debt");

        foundUser.debt = debt || 0;
        foundUser.sync();

        await interaction.followUp({ embeds: [ getErrorEmbed(`Cleared ${user.tag}'s debt.`).setTitle("Debt Cleared") ], ephemeral: true });
    },  
});