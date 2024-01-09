import { MessageEmbed } from "discord.js";
import PokerTable from "../../models/PokerTable";
import { Command } from "../../structures/Command";
import ConfigurationManager from "../../managers/ConfigManager";

export default new Command({
    name: "games",
    description: "List all poker games.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const tables = PokerTable.getTables().asArray();
        if (tables.length === 0) {
            return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Poker Rooms').setDescription('No poker rooms found.') ], ephemeral: true });
        }

        const config = new ConfigurationManager().loadConfig();
        let rooms: string = '';
        tables.forEach(table => rooms += `**Room ID**: ${table.gameId}\n**Game State**: ${table.gameState}\n**Players**: ${table.joined.length()}/${config.maxPlayers}` + '\n');
        
        return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Poker Rooms').setDescription(rooms) ], ephemeral: true });
    }
})