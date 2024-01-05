import { CommandInteractionOptionResolver } from "discord.js";
import { client } from "..";
import { Event } from "../structures/Event";
import { ExtendedInteraction } from "../typings/Command";

export default new Event("interactionCreate", async (interaction) => {
    // Chat Input Commands
    if (interaction.isCommand()) {
        await interaction.deferReply();
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            await interaction.deleteReply();
            return interaction.followUp({ content: "You have used a non existent command.", ephemeral: true });
        }

        command.run({
            args: interaction.options as CommandInteractionOptionResolver,
            client,
            interaction: interaction as ExtendedInteraction
        });
    }
});
