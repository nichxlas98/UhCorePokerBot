import { MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";
import PokerUser from "../../models/PokerUser";
import PokerTable from "../../models/PokerTable";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({

    name: "joingame",
    description: "Join a poker game.",
    options: [
        {
            name: "gameid",
            description: "The ID of the poker game to join.",
            type: 3,
            required: true
        },
        {
            name: "cash",
            description: "The amount of cash you're joining with. ($300 minimum, $1000 maximum)",
            type: 4,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const cash = interaction.options.getInteger("cash");

        if (cash < 300 || cash > 1000) {
            return interaction.followUp({ embeds: [ getErrorEmbed('The cash you join with must be between $300 and $1000.') ], ephemeral: true });
        }

        const user = PokerUser.findUserByUserId(interaction.user.id);
        if (!user || !user.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to join a poker game.') ], ephemeral: true });
        }

        PokerTable.getTables().forEach(table => {
            if (table.joined.contains(user.userName)) {
                return interaction.followUp({ embeds: [ getErrorEmbed('You are already in a poker game.') ], ephemeral: true });
            }
        });

        const gameid = interaction.options.getString("gameid");
        const foundTable = PokerTable.getInstanceById(gameid);

        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('No poker game with that ID was found.') ], ephemeral: true });
        }

        if (foundTable.joined.contains(user.userName)) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are already in that poker game.') ], ephemeral: true });
        }

        if (foundTable.joined.length() >= 8) {
            return interaction.followUp({ embeds: [ getErrorEmbed('That poker game is full.') ], ephemeral: true });
        }

        if (cash > user.balance) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You cannot afford to join with that much cash.') ], ephemeral: true });
        }

        user.balance -= cash - (cash * 0.10);
        user.debt += cash * 0.10;
        user.sync();

        foundTable.join(user.userName, cash);
        return interaction.followUp({ embeds: [ getErrorEmbed(`Joined poker game with ID **${gameid}**.`).setColor(0x00ff00) ], ephemeral: true });
    },
});