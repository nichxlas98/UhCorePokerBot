import { MessageEmbed } from "discord.js";
import PokerTable from "../../models/PokerTable";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";
import { getUrlFromImages } from "../../render";

export default new Command({
    name: "hand",
    description: "Show the cards in your poker hand.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const user = PokerUser.findUserByUserId(interaction.user.id);
        if (!user || !user.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to view your hand.') ], ephemeral: true });
        }

        const foundTable = PokerTable.getTables().find(table => table.joined.contains(user.userName));
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are not in a poker game.') ], ephemeral: true });
        }

        const pokerPlayer = foundTable.players.find(player => player.username === user.userName);
        if (!pokerPlayer) {
            return interaction.followUp({ embeds: [ getErrorEmbed("The game hasn't started yet.") ], ephemeral: true });
        }

        const handUrl = await getUrlFromImages(pokerPlayer.hand, 'output.png');
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setTitle('Your Hand')
            .setDescription(`**Your stack**: $${pokerPlayer.cash}`)
            .setImage(handUrl);


        await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
})