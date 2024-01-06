import { TextChannel } from "discord.js";
import { Command } from "../../structures/Command";

export default new Command({
    name: "endtalk",
    description: "End a private conversation.",
    options: [
        {
            name: "ticket",
            description: "The ticket to end.",
            type: 3,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        const ticket = interaction.options.getString("ticket");
        const channel = await interaction.client.channels.fetch(ticket);

        if (!channel) {
            return interaction.followUp({ content: "Ticket not found.", ephemeral: true });
        }

        if (!(channel instanceof TextChannel)) {
            return interaction.followUp({ content: "Ticket not found.", ephemeral: true });
        }

        if (!(channel.parent.name !== "Support Tickets")) {
            return interaction.followUp({ content: "Ticket not found.", ephemeral: true });
        }

        if (!(channel.name.startsWith("ticket-"))) {
            return interaction.followUp({ content: "Ticket not found.", ephemeral: true });
        }

        await channel.delete();
        return interaction.followUp({ content: "Ticket ended.", ephemeral: true });
    },
});