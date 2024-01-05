import { MessageEmbed } from "discord.js";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({
    name: "addbalance",
    description: "Add balance to an account.",
    options: [
        {
            name: "user",
            description: "The user to add balance to. (by username, or UUID)",
            type: 3,
            required: true
        },
        {
            name: "amount",
            description: "The amount of balance to add.",
            type: 4,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();
        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You must be an administrator to use this command.') ], ephemeral: true });
        }

        const user = interaction.options.getString("user");
        const amount = interaction.options.getInteger("amount");

        const foundUser = PokerUser.findUserByUserName(user);

        if (!foundUser) {
            return interaction.followUp({ embeds: [ getErrorEmbed('User not found.') ] });
        }

        foundUser.balance += amount;
        foundUser.sync();

        return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Success!').setDescription(`Added $${amount} to ${foundUser.userName}'s account balance.`) ], ephemeral: true });     
    },
});