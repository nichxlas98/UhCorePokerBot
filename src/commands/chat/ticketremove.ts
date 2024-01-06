import { TextChannel } from "discord.js";
import { Command } from "../../structures/Command";

export default new Command({
    name: "ticketremove",
    description: "Remove a user from a ticket.",
    options: [
        {
            name: "user",
            description: "The user to remove.",
            type: 6,
            required: true
        },
        {
            name: "ticket",
            description: "The ticket to remove the user from.",
            type: 3,
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
            return interaction.followUp({ content: "You cannot add yourself to a ticket.", ephemeral: true });
        }

        if (!(interaction.member?.permissions.has("ADMINISTRATOR"))) {
            return interaction.followUp({ content: "You do not have permission to use this command.", ephemeral: true });
        }

        const ticket = interaction.options.getString("ticket");
        const channel = await interaction.client.channels.fetch(ticket);

        if (!channel) {
            return interaction.followUp({ content: "Ticket not found. (ERR-1)", ephemeral: true });
        }

        if (!(channel instanceof TextChannel)) {
            return interaction.followUp({ content: "Ticket not found. (ERR-2)", ephemeral: true });
        }

        if (channel.parent.name !== "Support Tickets") {
            return interaction.followUp({ content: "Ticket not found. (ERR-3)", ephemeral: true });
        }

        if (!(channel.name.startsWith("ticket-"))) {
            return interaction.followUp({ content: "Ticket not found. (ERR-4)", ephemeral: true });
        }

        if (!(channel.permissionOverwrites.cache.get(user.id))) {
            return interaction.followUp({ content: "User isn't in the ticket. (ERR-5)", ephemeral: true });
        }

        await channel.permissionOverwrites.edit(user.id, {
            SEND_MESSAGES: false,
            VIEW_CHANNEL: false
        });

        return interaction.followUp({ content: `User removed from ticket.`, ephemeral: true });
    },
});