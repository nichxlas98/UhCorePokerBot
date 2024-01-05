import { MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";
import { getErrorEmbed } from "../../utils/MessageUtils";
import ConfigurationManager from "../../managers/ConfigManager";

export default new Command({

    name: "settings",
    description: "View or edit your current server settings.",
    options: [
        {
            name: "setting",
            description: "The setting to edit.",
            type: 3,
            required: true,
            choices: [
                {
                    name: "Game Creation",
                    value: "gameCreation"
                },
                {
                    name: "Maximum Players",
                    value: "maxPlayers"
                },
                {
                    name: "Max Starting Bets",
                    value: "maxStart"
                },
                {
                    name: "Min Starting Bets",
                    value: "minStart"
                },
                {
                    name: "Maximum Raise",
                    value: "maxRaise"
                },
                {
                    name: "Minimum Raise",
                    value: "minRaise"
                },
                {
                    name: "Max Starting Cash",
                    value: "maxStart"
                },
                {
                    name: "Min Starting Cash",
                    value: "minStart"
                }
            ]
        },
        {
            name: "value",
            description: "The value to set the setting to.",
            type: 3,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();

        if (!(interaction.member.permissions.has('ADMINISTRATOR'))) {
            return interaction.followUp({ embeds: [ getErrorEmbed("You do not have permission to use this command.") ], ephemeral: true });
        }

        const setting = interaction.options.getString("setting");
        const value = interaction.options.getString("value");

        const config = new ConfigurationManager().loadConfig();

        switch (setting) {
            case "gameCreation":
                if (value !== "true" && value !== "false") {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Value must be true or false.') ], ephemeral: true });
                }

                if (value === "true") config.gameCreation = true;
                else if (value === "false") config.gameCreation = false;
                break;
            case "maxPlayers":
                if (isNaN(parseInt(value))) {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Value must be a number.') ], ephemeral: true });
                }

                config.maxPlayers = parseInt(value);
                break;
            case "maxStart":
                if (isNaN(parseInt(value))) {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Value must be a number.') ], ephemeral: true });
                }

                config.maxStart = parseInt(value);
                break;
            case "minStart":
                if (isNaN(parseInt(value))) {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Value must be a number.') ], ephemeral: true });
                }

                config.minStart = parseInt(value);
                break;
            case "maxRaise":
                if (isNaN(parseInt(value))) {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Value must be a number.') ], ephemeral: true });
                }

                config.maxRaise = parseInt(value);
                break;
            case "minRaise":
                if (isNaN(parseInt(value))) {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Value must be a number.') ], ephemeral: true });
                }

                config.minRaise = parseInt(value);
                break;
            case "maxStart":
                if (isNaN(parseInt(value))) {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Value must be a number.') ], ephemeral: true });
                }

                config.maxStart = parseInt(value);
                break;
            case "minStart":
                if (isNaN(parseInt(value))) {
                    return interaction.followUp({ embeds: [ getErrorEmbed('Value must be a number.') ], ephemeral: true });
                }

                config.minStart = parseInt(value);
                break;
            default:
                return interaction.followUp({ embeds: [ getErrorEmbed('Invalid setting.') ], ephemeral: true });
        }

        new ConfigurationManager().saveConfig(config);
        return interaction.followUp({ embeds: [ new MessageEmbed().setTitle('Success!').setDescription(`Set ${setting} to ${value}.`) ], ephemeral: true });
    },
});