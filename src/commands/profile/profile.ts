import { MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";
import PokerUser from "../../models/PokerUser";
import { LogManager } from "../../managers/LogManager";
import { getErrorEmbed } from "../../utils/MessageUtils";
import { getStats } from "../../data/database";
import { ExtendedInteraction } from "../../typings/Command";

const viewProfile = async (interaction: ExtendedInteraction, foundUser: PokerUser, admin: boolean) => {
    await interaction.deleteReply();
    if (!foundUser) {
        return interaction.followUp({ embeds: [ getErrorEmbed('User not found.') ], ephemeral: true });
    }

    const playerStats = await getStats(foundUser.userId) || { userId: foundUser.userId, wins: 0, losses: 0, winnings: 0 };
    //const winLossRatio = playerStats.wins / (playerStats.losses + playerStats.wins) * 100;

    const embed = createProfileEmbed(foundUser, playerStats, interaction, admin);

    await interaction.followUp({ embeds: [ embed ], ephemeral: true });
    LogManager.getInstance().log(`Profile viewed: ${foundUser.userName} (${foundUser.userId}), by ${PokerUser.findUserByUserId(interaction.user.id).userName} (${interaction.user.username})`, 1);
};

const createProfileEmbed = (foundUser: PokerUser, playerStats: any, interaction: ExtendedInteraction, admin: boolean) => {
    const member = interaction.guild.members.cache.get(foundUser.userId);
    const title = admin ? 'Game Profile' : 'Profile';
    const authorName = admin ? `${foundUser.userName} (( ${member.user.username} ))` : `${foundUser.userName} (( Private ))`;

    const profileUrl = foundUser.profileUrl && foundUser.profileUrl.includes('https://') ? foundUser.profileUrl : `https://i.imgur.com/KkZTAyz.png`;

    const embed = new MessageEmbed()
        .setTitle(title)
        .setAuthor({ name: authorName, iconURL: admin ? member.user.displayAvatarURL() : profileUrl })
        .setDescription(createProfileDescription(foundUser, playerStats, admin))
        .setColor(0x7289DA);

    if (admin) {
        embed.addFields(
            { name: 'Master Account', value: foundUser.masterAccount, inline: true },
            { name: 'Character', value: foundUser.firstName + ' ' + foundUser.lastName, inline: true },
            { name: 'User ID', value: foundUser.userId, inline: false }
        );
    }

    return embed;
};

const createProfileDescription = (foundUser: PokerUser, playerStats: any, admin: boolean) => {
    const description = `\n**Username**: ${foundUser.userName}\n**Age**: ${foundUser.age}\n\n`;

    if (admin) {
        return description +
            `**Winnings**: $${playerStats.winnings}\n**Balance**: $${foundUser.balance}\n**Debt**: $${foundUser.debt}\n\n` +
            `**W/L Ratio**: ${playerStats.wins / (playerStats.losses + playerStats.wins) * 100}%\n` +
            `**Wins**: ${playerStats.wins}\n**Losses**: ${playerStats.losses}\n**Total Games**: ${playerStats.wins + playerStats.losses}\n\n` +
            `**Verified**: ${foundUser.verified ? 'Yes' : 'No'}\n**Created**: ${foundUser.createdAtFormatted}`;
    } else {
        return description +
            `**W/L Ratio**: ${playerStats.wins / (playerStats.losses + playerStats.wins) * 100}%\n` +
            `**Wins**: ${playerStats.wins}\n**Losses**: ${playerStats.losses}\n\n` +
            `**Verified**: ${foundUser.verified ? 'Yes' : 'No'}\n**Created**: ${foundUser.createdAtFormatted}`;
    }
};

export default new Command({
    name: "profile",
    description: "View an account's profile.",
    options: [
        { name: "user", description: "The user to view. (by username, or UUID)", type: 3, required: false },
        { name: "admin", description: "View the admin iteration of a profile.", type: 5, required: false }
    ],
    run: async ({ interaction }) => {
        const user = interaction.options.getString("user");
        const admin = interaction.options.getBoolean("admin");
        const foundUser = findUser(user, interaction);
        await viewProfile(interaction, foundUser, admin);
    },
});

const findUser = (user: string, interaction: ExtendedInteraction) => {
    if (!user) {
        return PokerUser.findUserByUserId(interaction.user.id);
    }

    if (/^\d+$/.test(user)) {
        if (interaction.member.permissions.has('ADMINISTRATOR')) {
            return PokerUser.findUserByUserId(user);
        } else {
            interaction.followUp({ embeds: [ getErrorEmbed('Insufficient permissions.') ], ephemeral: true })
                .then(() => setTimeout(() => interaction.deleteReply(), 5000));
            return null;
        }
    } else {
        return PokerUser.findUserByUserName(user);
    }
};