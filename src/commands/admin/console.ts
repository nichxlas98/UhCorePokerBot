import { Command } from "../../structures/Command";
import { LogManager } from "../../managers/LogManager";
import fs from 'fs';
import { getGameList, loadGame } from "../../data/database";
import path from "path";

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
        const logger = LogManager.getInstance();
        if (run === "all") {
            const allLogs = logger.getLogs();
            fs.writeFile('bot-logs.txt', allLogs, async (err) => {
                if (err) throw err;
                await interaction.channel.send({ content: "All Bot Logs.", files: ["./bot-logs.txt"] });
            });
            return;
        }

        if (run === "games") {
            const games = getGameList().toString().replace("[", "").replace("]", "").replaceAll(",", "\n");
            fs.writeFile('all-games.txt', games, async (err) => {
                if (err) throw err;
                await interaction.channel.send({ content: "All Games.", files: ["./all-games.txt"] });
            });
            return;
        }

        if (run && run.includes("game-")) {
            const gameId = run.split("game-")[1];
            const game = loadGame(gameId);

            if (!game) {
                return interaction.followUp({ content: "Game not found.", ephemeral: true });
            }
            
            const filePath = path.resolve(`./src/data/games/${game.chatLogs}.json`);
            return interaction.channel.send({ content: 'Game: ' + game.gameId + '\n' + game.players + '\n', files: [filePath] });
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