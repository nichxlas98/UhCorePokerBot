import { Logger } from "../../logs/Logger";
import { Command } from "../../structures/Command";
import { exec } from 'child_process';

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

export default new Command({
    name: "restart",
    description: "Restart the bot in its entirety.",
    run: async ({ interaction }) => {
        if (interaction.member.user.id !== '315272242529304587' && !(interaction.member.permissions.has('ADMINISTRATOR'))) {
            await interaction.deleteReply();
            return interaction.followUp({ content: "You do not have permission to use this command.", ephemeral: true });
        }

        const logger = Logger.getInstance();
        await interaction.deleteReply();
        await interaction.followUp({ content: "Restarting...", ephemeral: true }).then(() => {
            interaction.client.user.setPresence({
                status: 'dnd',
                activities: [{
                    name: 'Restarting...',
                    type: 'PLAYING'
                }]
            });

            logger.log("Restarting...", 1);
            setTimeout(() => {
                logger.log("Status updated...");
            }, 30000);
        });

        exec('cd ~', (err, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            console.log(err);

            logger.log("Reloading...");
        });
        exec('/home/ubuntu/discord_run.sh', (err, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            console.log(err);

            logger.log("Running restart script.");
            
            // Exit the Node.js program
            process.exit(0);
        });
    }
});
