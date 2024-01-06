import { LogManager } from "../../managers/LogManager";
import { Command } from "../../structures/Command";

export default new Command({
    name: "talkto",
    description: "Bring a user to a private channel for discussion.",
    options: [
        {
            name: "user",
            description: "The user to talk to.",
            type: 6,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const user = interaction.options.getUser("user");
        if (user.bot) return;

        if (!user) {
            return interaction.followUp({ content: "User not found.", ephemeral: true });
        }

        if (user.id === interaction.user.id) {
            return interaction.followUp({ content: "You cannot talk to yourself.", ephemeral: true });
        }

        if (!(interaction.member?.permissions.has("ADMINISTRATOR"))) {
            return interaction.followUp({ content: "You do not have permission to use this command.", ephemeral: true });
        }

        const guild = interaction.guild!;

        let category = guild.channels.cache.find((channel) => channel.name === "Support Tickets");
        if (!category) {
            category = await guild.channels.create("Support Tickets", {
                type: "GUILD_CATEGORY"
            });

            await category.permissionOverwrites.edit(guild.roles.everyone.id, { VIEW_CHANNEL: false });
        }

        const channel = await guild.channels.create(`ticket-${user.id}`, {
            type: "GUILD_TEXT"
        });

        await channel.setParent(category.id);

        await channel.permissionOverwrites.edit(guild.roles.everyone.id, { VIEW_CHANNEL: false });
        await channel.permissionOverwrites.edit(user.id, { VIEW_CHANNEL: true });
        await channel.permissionOverwrites.edit(interaction.user.id, { VIEW_CHANNEL: true });

        LogManager.getInstance().log(`User ${interaction.user.tag} (${interaction.user.id}) created ticket: ${channel.id} with ${user.tag} (${user.id})`, 1);
        await interaction.followUp({ content: `Your ticket has been created. <#${channel.id}>`, ephemeral: true });
    },
});