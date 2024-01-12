import { MessageEmbed } from "discord.js";
import PokerRoom from "../../poker/PokerRoom";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { GamePhase, GameState, PlayerAction } from "../../enums/States";
import { getErrorEmbed } from "../../utils/MessageUtils";
import ConfigurationManager, { Config } from "../../managers/ConfigManager";
import PokerPlayer from "../../models/PokerPlayer";
import { ExtendedInteraction } from "../../typings/Command";
import PokerController from "../../poker/PokerController";


export default new Command({
    name: "raise",
    description: "Raise a bet.",
    options: [
        {
            name: "amount",
            description: "The amount to raise.",
            type: 4,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        await interaction.deleteReply();
        
        const amount = interaction.options.getInteger("amount");

        const foundPlayer = PokerUser.findUserByUserId(interaction.user.id);
        if (!foundPlayer || !foundPlayer.verified) {
            return interaction.followUp({ embeds: [ getErrorEmbed('Your account must be verified to raise a bet.') ], ephemeral: true });
        }

        const foundTable = PokerController.getRooms().find(table => table.joined.contains(foundPlayer.userName));
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are not in a poker game.') ], ephemeral: true });
        }

        const pokerPlayer = foundTable.players.find(player => player.username === foundPlayer.userName);
        if (!pokerPlayer || foundTable.gameState === GameState.STARTING) {
            return interaction.followUp({ embeds: [ getErrorEmbed("The game hasn't started yet.") ], ephemeral: true });
        }

        if (amount >= pokerPlayer.cash) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You cannot raise more than, or all you have. You can go all-in instead.') ], ephemeral: true });
        }

        if (!pokerPlayer.isPlayersTurn) {
            return interaction.followUp({ embeds: [ getErrorEmbed('It is not your turn to raise/place a starting bet.') ], ephemeral: true });
        }

        const config = new ConfigurationManager().loadConfig();

        if (foundTable.gamePhase === GamePhase.BLIND && foundTable.winningPool === 0) {
            placeStartingBet(interaction, foundTable, foundPlayer, pokerPlayer, config, amount);
            return;
        }

        raiseCurrentBet(interaction, foundTable, foundPlayer, pokerPlayer, config, amount);
        return interaction.followUp({ embeds: [ getErrorEmbed("You have raised your bet successfully.").setTitle(`Current Bet: $${pokerPlayer.currentBet}`) ], ephemeral: true });
    },
});

const handleBet = async (foundTable: PokerRoom, pokerPlayer: PokerPlayer, pokerUser: PokerUser, amount: number, action: PlayerAction) => {
    pokerPlayer.cash -= amount;
    pokerPlayer.currentBet = amount;
    pokerPlayer.lastAction = action;
    pokerPlayer.actions++;
    
    foundTable.lastBet = amount;
    foundTable.winningPool += amount;

    const raiseOrStart = action === PlayerAction.RAISE ? "raised to" : "placed a starting bet of";
    await foundTable.chatManager.postChat(`**[GAME]** **${pokerUser.userName}** ${raiseOrStart} $${amount}.`);
    foundTable.nextTurn(pokerPlayer);
}

const placeStartingBet = (interaction: ExtendedInteraction, foundTable: PokerRoom, foundPlayer: PokerUser, pokerPlayer: PokerPlayer, config: Config, amount: number) => {    
    if (amount > config.maxStart) {
        return interaction.followUp({ embeds: [ getErrorEmbed(`The maximum starting bet is $${config.maxStart}.`) ], ephemeral: true });
    }
    
    if (amount < config.minStart) {
        return interaction.followUp({ embeds: [ getErrorEmbed(`The minimum starting bet is $${config.minStart}.`) ], ephemeral: true });
    }

    handleBet(foundTable, pokerPlayer, foundPlayer, amount, PlayerAction.START);
};

const raiseCurrentBet = (interaction: ExtendedInteraction, foundTable: PokerRoom, foundPlayer: PokerUser, pokerPlayer: PokerPlayer, config: Config, amount: number) => {
    if (amount > config.maxRaise) {
        return interaction.followUp({ embeds: [ getErrorEmbed(`The maximum raise amount is $${config.maxRaise}.`) ], ephemeral: true });
    }

    if (amount < config.minRaise) {
        return interaction.followUp({ embeds: [ getErrorEmbed(`The minimum raise amount is $${config.minRaise}.`) ], ephemeral: true });
    }

    handleBet(foundTable, pokerPlayer, foundPlayer, amount, PlayerAction.RAISE);
};