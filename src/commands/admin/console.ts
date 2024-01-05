import { Command } from "../../structures/Command";
import { Logger } from "../../logs/Logger";
import { exec } from 'child_process';
import fs from 'fs';

export default new Command({
    name: "console",
    description: "View the bot terminal logs.",
    options: [
        {
            name: "run",
            description: "Run a command on the server terminal. (Dangerous)",
            type: 3
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();
        if (!(interaction.member.permissions.has('ADMINISTRATOR'))) {
            return interaction.followUp({ content: "You do not have permission to use this command.", ephemeral: true });
        }

        const run = interaction.options.getString("run");
        const logger = Logger.getInstance();
        if (run === "all") {
            const allLogs = logger.getLogs();
            fs.writeFile('bot-logs.txt', allLogs, async (err) => {
                if (err) throw err;
                await interaction.channel.send({ content: "All Bot Logs.", files: ["./bot-logs.txt"] });
            });
            return;
        }
        const logs = logger.getLogs().length > 3800 ? logger.getLogs().slice(0, 3800) + "..." : logger.getLogs();
        await interaction.followUp({
            embeds: [
                {
                    title: "Bot Terminal",
                    description: `${logs}`,
                    color: 15130393,
                    author: {
                        name: interaction.client.user.username,
                        iconURL: interaction.client.user.avatarURL()
                    }
                }
            ],
            ephemeral: true
        });
    }
});