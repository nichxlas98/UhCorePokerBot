import { MessageEmbed } from "discord.js";
import PokerRoom from "../../poker/PokerRoom";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";
import { getUrlFromImages } from "../../render";
import { GameState } from "../../enums/States";
import PokerController from "../../poker/PokerController";

export default new Command({
    name: "hand",
    description: "Show the cards in your poker hand.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const user = PokerUser.findUserByUserId(interaction.user.id);
        if (!user || !user.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to view your hand.') ], ephemeral: true });
        }

        const foundTable = PokerController.getRooms().find(table => table.joined.contains(user.userName));
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are not in a poker game.') ], ephemeral: true });
        }

        const pokerPlayer = foundTable.players.find(player => player.username === user.userName);
        if (!pokerPlayer || foundTable.gameState === GameState.STARTING) {
            return interaction.followUp({ embeds: [ getErrorEmbed("The game hasn't started yet.") ], ephemeral: true });
        }

        const handUrl = await getUrlFromImages(pokerPlayer.hand, 'output.png');
        const handString = pokerPlayer.hand.toString();
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setTitle('Your Hand')
            .setDescription(`**Your stack**: $${pokerPlayer.cash}\n**Your hand**: ${handString.replaceAll(',', ', ').replaceAll('.png', '')}`)
            .setImage(handUrl);


        await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
})