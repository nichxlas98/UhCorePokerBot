import { MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";
import PokerUser from "../../models/PokerUser";
import { LogManager } from "../../managers/LogManager";
import { getErrorEmbed } from "../../utils/MessageUtils";
import { getStats } from "../../data/database";

export default new Command({
    name: "profile",
    description: "View an account's profile.",
    options: [
        {
            name: "user",
            description: "The user to view. (by username, or UUID)",
            type: 3,
            required: false
        },
        {
            name: "admin",
            description: "View the admin iteration of a profile.",
            type: 5,
            required: false
        }
    ],
    run: async ({ interaction }) => {
        const user = interaction.options.getString("user");
        const admin = interaction.options.getBoolean("admin");
        let foundUser: PokerUser;
        if (user) {
            if (/^\d+$/.test(user)) { // String contains only numbers, meaning it's a UUID
                if (interaction.member.permissions.has('ADMINISTRATOR')) {
                    foundUser = PokerUser.findUserByUserId(user);
                } else {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Insufficient permissions.') ], ephemeral: true });
                }
            } else { // String contains letters, meaning it's a username
                foundUser = PokerUser.findUserByUserName(user);
            }
        } else {
            foundUser = PokerUser.findUserByUserId(interaction.user.id);
        }

        await interaction.deleteReply();
        if (!foundUser) {
            return interaction.followUp({ embeds: [ getErrorEmbed('User not found.') ], ephemeral: true });
        }

        let playerStats = getStats(foundUser.userId);

        if (!playerStats) {
            playerStats = {
                userId: foundUser.userId,
                wins: 0,
                losses: 0,
                winnings: 0
            }
        }

        const winLossRatio = playerStats.wins / (playerStats.losses + playerStats.wins) * 100;

        const member = interaction.guild.members.cache.get(foundUser.userId);
        let embed: MessageEmbed;

        if (interaction.member.permissions.has('ADMINISTRATOR') && admin) {
            embed = new MessageEmbed()
                .setTitle('Game Profile')
                .setAuthor({ name: `${foundUser.userName} (( ${member.user.username} ))`, iconURL: member.user.displayAvatarURL() })
                .setDescription(`\n**Username**: ${foundUser.userName}\n**Age**: ${foundUser.age}\n\n**Winnings**: $${playerStats.winnings}\n**Balance**: $${foundUser.balance}\n**Debt**: $${foundUser.debt}\n\n**W/L Ratio**: ${winLossRatio.toFixed(2)}%\n**Wins**: ${playerStats.wins}\n**Losses**: ${playerStats.losses}\n**Total Games**: ${playerStats.wins + playerStats.losses}\n\n**Verified**: ${foundUser.verified ? 'Yes' : 'No'}\n**Created**: ${foundUser.createdAtFormatted}`)
                .setColor(0x7289DA)
                .addFields(
                    { 
                        name: 'Master Account', 
                        value: foundUser.masterAccount,
                        inline: true
                    },
                    {
                        name: 'Character', 
                        value: foundUser.firstName + ' ' + foundUser.lastName,
                        inline: true
                    },
                    {
                        name: 'User ID', 
                        value: foundUser.userId,
                        inline: false
                    });
        } else {
            if (foundUser.userId === interaction.user.id) {
                embed = new MessageEmbed()
                    .setTitle('Profile')
                    .setAuthor({ name: `${foundUser.userName} (( Private ))`, iconURL: foundUser.profileUrl })
                    .setDescription(`\n**Username**: ${foundUser.userName}\n**Age**: ${foundUser.age}\n\n**Balance**: $${foundUser.balance}\n**W/L Ratio**: ${winLossRatio.toFixed(2)}%\n**Wins**: ${playerStats.wins}\n**Losses**: ${playerStats.losses}\n**Winnings**: $${playerStats.winnings}\n\n**Verified**: ${foundUser.verified ? 'Yes' : 'No'}\n**Created**: ${foundUser.createdAtFormatted}`)
                    .setColor(0x7289DA);
            } else {
                embed = new MessageEmbed()
                .setTitle('Profile')
                .setAuthor({ name: `${foundUser.userName} (( Private ))`, iconURL: foundUser.profileUrl })
                .setDescription(`\n**Username**: ${foundUser.userName}\n**Age**: ${foundUser.age}\n\n**Verified**: ${foundUser.verified ? 'Yes' : 'No'}\n**Created**: ${foundUser.createdAtFormatted}`)
                .setColor(0x7289DA);
            }
        }

        await interaction.followUp({ embeds: [ embed ], ephemeral: true });
        LogManager.getInstance().log(`Profile viewed: ${foundUser.userName} (${foundUser.userId}), by ${PokerUser.findUserByUserId(interaction.user.id).userName} (${interaction.user.username})`, 1);
    },
});