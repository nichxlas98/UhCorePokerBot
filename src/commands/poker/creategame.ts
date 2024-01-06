import { MessageEmbed } from "discord.js";
import PokerTable from "../../models/PokerTable";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";
import { LogManager } from "../../managers/LogManager";
import ConfigurationManager from "../../managers/ConfigManager";

export default new Command({
    name: "creategame",
    description: "Create a poker game.",
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const user = PokerUser.findUserByUserId(interaction.user.id);
        if (!user || !user.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to create a poker game.') ], ephemeral: true });
        }

        const config = new ConfigurationManager().loadConfig();
        if (!(interaction.member.permissions.has("ADMINISTRATOR")) && config.gameCreation === false) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You do not have permission to use this command.') ], ephemeral: true });
        }

        const guild = interaction.guild;
        let gameId: string;

        await guild.channels.create(`poker-room-${PokerTable.getTables().length() + 1}`, {
            type: 'GUILD_TEXT'
        }).then(async (channel) => {
            gameId = channel.id;
            await channel.setParent('1191808100609568808');
            await channel.permissionOverwrites.edit(guild.roles.everyone.id, { VIEW_CHANNEL: false });
            new PokerTable(gameId, channel);
        });

        LogManager.getInstance().log(`Poker game created: ${gameId} by ${user.userName}`, 1);
        return interaction.followUp({ content: 'Poker game created! Join using ID: ' + gameId, ephemeral: true });
    },
});