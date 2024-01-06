import { MessageEmbed, TextChannel } from "discord.js";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { LogManager } from "../../managers/LogManager";
import { getErrorEmbed } from "../../utils/MessageUtils";

export default new Command({

    name: "verify",
    description: "Verify a user account.",
    options: [
        {
            name: "user",
            description: "The user to verify.",
            type: 6,
            required: true
        },
        {
            name: "master",
            description: "The user's master account name.",
            type: 3,
            required: true
        },
        {
            name: "character",
            description: "The user's character name.",
            type: 3,
            required: true
        },
        {
            name: "username",
            description: "The character's username.",
            type: 3,
            required: true
        },
        {
            name: "identification",
            description: "The character's ID/stats photo URL.",
            type: 3,
            required: true
        },
        {
            name: "age",
            description: "The user's age.",
            type: 4,
            required: true
        },
        {
            name: "profile",
            description: "The user's profile picture URL.",
            type: 3,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        if (!(interaction.member.permissions.has('ADMINISTRATOR'))) {
            return interaction.followUp({ embeds: [ getErrorEmbed("You do not have permission to use this command.") ], ephemeral: true });
        }

        const verify = {
            user: interaction.options.getUser("user"),
            master: interaction.options.getString("master"),
            character: interaction.options.getString("character"),
            username: interaction.options.getString("username"),
            identification: interaction.options.getString("identification"),
            age: interaction.options.getInteger("age"),
            profile: interaction.options.getString("profile"),
        };

        await interaction.deleteReply();
        if (verify.user.bot) {
            return interaction.followUp({ embeds: [ getErrorEmbed("You cannot verify a bot.") ], ephemeral: true });
        }
        
        if (verify.character.length < 3) {
            return interaction.followUp({ embeds: [ getErrorEmbed("Character name must be at least 3 characters long.") ], ephemeral: true });
        }

        if (!(verify.character.includes(" "))) {
            return interaction.followUp({ embeds: [ getErrorEmbed("Character name must contain both the first and last name of the character separated by a space. Example: 'John Doe'") ], ephemeral: true });
        }

        if (verify.username.length < 3) {
            return interaction.followUp({ embeds: [ getErrorEmbed("Username must be at least 3 characters long.") ], ephemeral: true });
        }

        const userExists = PokerUser.findUserByUserId(verify.user.id);
        if (!userExists) {
            return interaction.followUp({ embeds: [ getErrorEmbed("User not found.") ], ephemeral: true });
        }

        const member = await interaction.guild?.members.fetch(verify.user.id);
        if (member) {
            if (member.user.id !== '315272242529304587') member.setNickname(`${verify.character}`);
            member.roles.add('1191654760600842322');
            member.roles.remove('1191654861238972446');
        }
        
        userExists.masterAccount = verify.master;
        userExists.userName = verify.username;
        userExists.photoId = verify.identification;
        userExists.firstName = verify.character.split(" ")[0];
        userExists.lastName = verify.character.split(" ")[1];
        userExists.age = verify.age;
        userExists.profileUrl = verify.profile;

        userExists.verified = true;
        userExists.sync();

        const verifyChannel = await interaction.guild?.channels.fetch('1191654861238972446');
        if (verifyChannel && verifyChannel instanceof TextChannel) {
            await verifyChannel.send({ content: `<@${userExists.userId}>'s account has been registered successfully.` });
        }

        await interaction.followUp({ embeds: [ new MessageEmbed().setTitle("User verified!").setColor(0x33FF33).setDescription("User verified successfully!") ], ephemeral: true });
        LogManager.getInstance().log(`User verified: ${userExists.userId}, by ${interaction.user.username}`, 1);
    },
});
