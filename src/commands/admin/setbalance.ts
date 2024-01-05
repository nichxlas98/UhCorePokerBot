import { MessageEmbed } from "discord.js";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({
    name: "setbalance",
    description: "Set the balance of a user.",
    options: [
        {
            name: "user",
            description: "The user to set the balance of.",
            type: 6,
            required: true
        },
        {
            name: "balance",
            description: "The balance to set the user to.",
            type: 4,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You must be an administrator to use this command.') ], ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        const balance = interaction.options.getInteger("balance");

        if (balance < 0) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Balance must be greater than 0.') ], ephemeral: true });
        }

        const foundUser = PokerUser.findUserByUserId(user.id);
        if (!foundUser) {
            return interaction.followUp({ embeds: [ getErrorEmbed('User not found.') ], ephemeral: true });
        }

        foundUser.balance = balance;
        foundUser.sync();
        return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Success!').setDescription(`Set ${foundUser.userName}'s balance to $${balance}.`) ], ephemeral: true });
    },
});