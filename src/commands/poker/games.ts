import PokerRoom from "../../poker/PokerRoom";
import { MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";
import ConfigurationManager from "../../managers/ConfigManager";
import PokerController from "../../poker/PokerController";

export default new Command({
    name: "games",
    description: "List all poker games.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const tables = PokerController.getRooms().asArray();
        if (tables.length === 0) {
            return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Poker Rooms').setDescription('No poker rooms found.') ], ephemeral: true });
        }

        const config = new ConfigurationManager().loadConfig();
        let rooms: string = '';
        tables.forEach(table => rooms += `**Room ID**: ${table.gameId}\n**Game State**: ${table.gameState}\n**Players**: ${table.joined.length()}/${config.maxPlayers}` + '\n');
        
        return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Poker Rooms').setDescription(rooms) ], ephemeral: true });
    }
})