import { MessageEmbed } from "discord.js";
import PokerTable from "../../models/PokerTable";
import { Command } from "../../structures/Command";
import ConfigurationManager from "../../managers/ConfigManager";

export default new Command({
    name: "games",
    description: "List all poker games.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const config = new ConfigurationManager().loadConfig();
        let rooms: string = '*';
        for (const table of PokerTable.getTables().asArray()) {
            rooms += `*Room ID**: ${table.gameId}\n**Game State**: ${table.gameState}\n**Players**: ${table.joined.length()}/${config.maxPlayers}` + '\n*';
        }

        if (rooms === '*') {
            return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Poker Rooms').setDescription('No poker rooms found.') ], ephemeral: true });
        }

        return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Poker Rooms').setDescription(rooms) ], ephemeral: true });
    }
})