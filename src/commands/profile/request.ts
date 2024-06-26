import { MessageEmbed, TextBasedChannel, TextChannel } from "discord.js";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { LogManager } from "../../managers/LogManager";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({
    name: "request",
    description: "Request profile verification.",
    options: [
        {
            name: "master",
            description: "The master account associated with the account.",
            type: 3,
            required: true
        },
        {
            name: "username",
            description: "The In-Character username requested for the account. (must not already be taken!)",
            type: 3,
            required: true
        },
        {
            name: "character",
            description: "The first, and last name of the character associated with the account. Example: 'John Doe'",
            type: 3,
            required: true
        },
        {
            name: "age",
            description: "The age of the account.",
            type: 4,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        const request = {
            username: interaction.options.getString("username"),
            character: interaction.options.getString("character"),
            master: interaction.options.getString("master"),
            age: interaction.options.getInteger("age")
        };

        await interaction.deleteReply();
        if (!request.username || !request.character) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Missing required fields.') ], ephemeral: true });
        }

        if (request.username.length > 20) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Username must be less than 20 characters.') ], ephemeral: true });
        }

        if (request.username.length < 3) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Username must be at least 3 characters.') ], ephemeral: true });
        }

        if (PokerUser.findUserByUserName(request.username)) {
            return interaction.followUp({ embeds: [ getErrorEmbed('That username is already taken.') ], ephemeral: true });
        }

        if (request.character.includes('_')) {
            return interaction.followUp({ embeds: [ getErrorEmbed("Character name shouldn't contain underscores. Use spaces instead (Example: 'John Doe').") ], ephemeral: true });
        }

        const embed = getReqeustEmbed(interaction.user.id, request.master, request.username, request.character, request.age);

        const channel = await interaction.guild.channels.fetch('1191657224825753681'); // #pending-approval channel
        if (!channel) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Could not find #pending-approval channel. Please contact an administrator.') ], ephemeral: true });
        }

        const verifyChannel = await interaction.guild.channels.fetch('1192486674916184175');
        if (verifyChannel) {
            await (verifyChannel as TextChannel).send({
                content: '||<@&1191654216482160642>||', embeds: [
                    {
                        title: 'Account Request',
                        description: `<@${interaction.user.id}>'s requesting account verification. \n<@&1191654216482160642> will review it shortly.`,
                        color: 0x7289DA
                    }
                ]
            });
        }

        await (channel as TextBasedChannel).send({ embeds: [ embed ] });
        await interaction.followUp({ content: 'Request sent successfully! Your request should be approved in a brief moment, or you may be asked to correct a specific field of information.\n**If you have any questions, feel free to contact <@315272242529304587> directly for more information.\n\n**', embeds: [ embed ], ephemeral: true });
        LogManager.getInstance().log(`Profile verification requested: ${request.username} (${request.character}), by ${interaction.user.username} (${interaction.user.id})`, 1);
    },
});

const getReqeustEmbed = (userId: string, masterAccount: string, username: string, character: string, age: number): MessageEmbed => {
    return new MessageEmbed()
    .setTitle('Account Activation Request')
    .setDescription(`**Master**: ${masterAccount}\n**Username**: ${username}\n**Character**: ${character}\n**Age**: ${age}\n**Profile URL**: N/A`)
    .setColor(0x7289DA)
    .addFields(
        {
            name: '(( Requested By ))',
            value: `<@${userId}>`,
            inline: true
        },
        {
            name: '(( Profile Verification ))',
            value: `N/A`,
            inline: false
        });
};