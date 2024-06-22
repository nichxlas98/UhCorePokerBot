import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";
import PokerController from "../../poker/PokerController";

export default new Command({
    name: "chat",
    description: "Sends a chat message to the current poker table.",
    options: [
        {
            name: "message",
            description: "The message to send.",
            type: 3,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        const message = interaction.options.getString("message");

        await interaction.deleteReply();

        const pokerUser = PokerUser.findUserByUserId(interaction.user.id);
        if (!pokerUser || !pokerUser.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to chat.') ], ephemeral: true });
        }

        const foundTable = PokerController.getRooms().find(table => table.joined.contains(pokerUser.userName));
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are not in a poker game.') ], ephemeral: true });
        }

        if (message.length > 100) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your message is too long. (100 characters max)') ], ephemeral: true });
        }

        const specialCharacters = ['*', '`', '#', '~', '_', '|', '\n'];
        const cleanedMessage = message.replaceAll(new RegExp(`[${specialCharacters.join('')}]`, 'g'), '');
    
        foundTable.chat(pokerUser.userName, cleanedMessage);
        return;
    },
});