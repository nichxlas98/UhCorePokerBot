import { MessageEmbed } from "discord.js";
import PokerTable from "../../models/PokerTable";
import PokerUser from "../../models/PokerUser";
import { Command } from "../../structures/Command";
import { GamePhase, GameState, PlayerAction } from "../../enums/States";
import { getErrorEmbed } from "../../utils/MessageUtils";
import ConfigurationManager, { Config } from "../../managers/ConfigManager";
import PokerPlayer from "../../models/PokerPlayer";
import { ExtendedInteraction } from "../../typings/Command";


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

        const foundTable = PokerTable.getTables().find(table => table.joined.contains(foundPlayer.userName));
        if (!foundTable) {
            return interaction.followUp({ embeds: [ getErrorEmbed('You are not in a poker game.') ], ephemeral: true });
        }

        const pokerPlayer = foundTable.players.find(player => player.username === foundPlayer.userName);
        if (!pokerPlayer) {
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

        raise(interaction, foundTable, foundPlayer, pokerPlayer, config, amount);
        return interaction.followUp({ embeds: [ getErrorEmbed("You have raised your bet successfully.").setTitle(`Current Bet: $${pokerPlayer.currentBet}`) ], ephemeral: true });
    },
});

const bet = (foundTable: PokerTable, pokerPlayer: PokerPlayer, pokerUser: PokerUser, amount: number, action: PlayerAction) => {
    pokerPlayer.cash -= amount;
    pokerPlayer.currentBet = amount;
    pokerPlayer.lastAction = action;
    pokerPlayer.actions++;
    
    foundTable.lastBet = amount;
    foundTable.winningPool += amount;

    const raiseOrStart = action === PlayerAction.RAISE ? "raised to" : "placed a starting bet of";
    foundTable.postChat(`**[GAME]** **${pokerUser.userName}** ${raiseOrStart} $${amount}.`);
    foundTable.nextPlayerTurn(pokerPlayer);
}

const placeStartingBet = (interaction: ExtendedInteraction, foundTable: PokerTable, foundPlayer: PokerUser, pokerPlayer: PokerPlayer, config: Config, amount: number) => {    
    if (amount > config.maxStart) {
        return interaction.followUp({ embeds: [ getErrorEmbed(`The maximum starting bet is $${config.maxStart}.`) ], ephemeral: true });
    }
    
    if (amount < config.minStart) {
        return interaction.followUp({ embeds: [ getErrorEmbed(`The minimum starting bet is $${config.minStart}.`) ], ephemeral: true });
    }

    bet(foundTable, pokerPlayer, foundPlayer, amount, PlayerAction.START);
};

const raise = (interaction: ExtendedInteraction, foundTable: PokerTable, foundPlayer: PokerUser, pokerPlayer: PokerPlayer, config: Config, amount: number) => {
    if (amount > config.maxRaise) {
        return interaction.followUp({ embeds: [ getErrorEmbed(`The maximum raise amount is $${config.maxRaise}.`) ], ephemeral: true });
    }

    if (amount < config.minRaise) {
        return interaction.followUp({ embeds: [ getErrorEmbed(`The minimum raise amount is $${config.minRaise}.`) ], ephemeral: true });
    }

    bet(foundTable, pokerPlayer, foundPlayer, amount, PlayerAction.RAISE);
};