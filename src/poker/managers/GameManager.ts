import { saveStats } from "../../data/database";
import { Cards } from "../../enums/Cards";
import { GamePhase, GameState, PlayerAction, PlayerState } from "../../enums/States";
import List from "../../models/List";
import PokerPlayer from "../../models/PokerPlayer";
import PokerUser from "../../models/PokerUser";
import { getUrlFromImages } from "../../render";
import { getGameWinners, getHandType } from "../../utils/CalculateUtils";
import PokerController from "../PokerController";
import PokerRoom from "../PokerRoom";

class GameManager { // update player turns, update game rounds

    constructor (private gameId: string) {}

    public handleNewRound(phase?: GamePhase) {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
        if (pokerRoom.turn === 0 && pokerRoom.lastTurn > 0 && !phase) {
          this.advanceGamePhase();
        }
    
        if (pokerRoom.gamePhase === GamePhase.BLIND) {
          return;
        }
    
        this.handlePhaseActions();
    }
    
    private advanceGamePhase() {
      const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
      switch (pokerRoom.gamePhase) {
        case GamePhase.BLIND:
          pokerRoom.gamePhase = GamePhase.PRE_FLOP;
          break;
        case GamePhase.PRE_FLOP:
          pokerRoom.gamePhase = GamePhase.FLOP;
          break;
        case GamePhase.FLOP:
          pokerRoom.gamePhase = GamePhase.TURN;
          break;
        case GamePhase.TURN:
          pokerRoom.gamePhase = GamePhase.RIVER;
          break;
        case GamePhase.RIVER:
          pokerRoom.gamePhase = GamePhase.END;
          break;
        case GamePhase.END:
          pokerRoom.gamePhase = GamePhase.BLIND;
          break;
      }
    }

    private handlePhaseActions() {
      const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
      switch (pokerRoom.gamePhase) {
        case GamePhase.PRE_FLOP:
          this.dealPlayerHands();
          break;
        case GamePhase.FLOP:
          this.updateCommunityCards([pokerRoom.cardsManager.generateCard(), pokerRoom.cardsManager.generateCard(), pokerRoom.cardsManager.generateCard(), Cards.DEFAULT_CARD, Cards.DEFAULT_CARD]);
          break;
        case GamePhase.TURN:
          this.updateCommunityCards([pokerRoom.cardsManager.communityCards[0], pokerRoom.cardsManager.communityCards[1], pokerRoom.cardsManager.communityCards[2], pokerRoom.cardsManager.generateCard(), Cards.DEFAULT_CARD]);
          break;
        case GamePhase.RIVER:
          this.updateCommunityCards([pokerRoom.cardsManager.communityCards[0], pokerRoom.cardsManager.communityCards[1], pokerRoom.cardsManager.communityCards[2], pokerRoom.cardsManager.communityCards[3], pokerRoom.cardsManager.generateCard()]);
          break;
        case GamePhase.END:
          this.handleGameEnd();
          break;
      }
    }

    private async dealPlayerHands() {
      const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
      for (const player of pokerRoom.players.asArray()) {
        player.hand = [pokerRoom.cardsManager.generateCard(), pokerRoom.cardsManager.generateCard()];
        await getUrlFromImages(player.hand, 'output.png').then(url => {
          pokerRoom.cardsManager.hands.set(player.username, url);
        });
      }
    }

    private updateCommunityCards(cards: Cards[]) {
      const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
      pokerRoom.cardsManager.sendCommunityCards(cards).then(() => {
        pokerRoom.chatManager.postChat('**[GAME]** Community cards updated.');
      });
    }
    
    handleGameEnd() {
      const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
      if (pokerRoom.gamePhase === GamePhase.END) {
        this.announceGameEnd();
        this.calculateWinners();
        this.announceWinners();
        this.revealPlayerHands();
        this.tryStartNewGame();
      }
    }

    private async announceGameEnd() {
      const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
      await pokerRoom.chatManager.postChat('**[GAME]** Game ended!');
      for (const player of pokerRoom.players.asArray()) {
        this.handlePlayerEndGame(player);
      }
    }

    private handlePlayerEndGame(player: PokerPlayer) {
      const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
      if (player.cash === 0) {
        player.playerState = PlayerState.BUSTED;
        pokerRoom.chatManager.postChat(`**[GAME]** ${player.username} busted!`);
      } else if (player.playerState !== PlayerState.QUIT) {
        player.playerState = PlayerState.PLAYING;
        player.lastAction = PlayerAction.START;
      }
    }

    private calculateWinners() {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
        const playersAlive = this.getAlivePlayers();
        const winners = this.getValidWinners(playersAlive);

        playersAlive.forEach(player => {
          let winner = false;
          if (winners.includes(player)) {
            player.cash += pokerRoom.winningPool / winners.length;
            winner = true;
          }
        
          saveStats(PokerUser.findUserByUserName(player.username)!.userId, winner, winner ? pokerRoom.winningPool / winners.length : 0);
        });
    }

    private getAlivePlayers(): List<PokerPlayer> {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
        const playersAlive = new List<PokerPlayer>();
        playersAlive.addAll(pokerRoom.players.asArray().filter(player => player.playerState !== PlayerState.QUIT && player.playerState !== PlayerState.BUSTED));
        return playersAlive;
    }

    private getValidWinners(playersAlive: List<PokerPlayer>): PokerPlayer[] {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
        return getGameWinners(playersAlive, pokerRoom.cardsManager.communityCards).filter(winner => winner.playerState !== PlayerState.FOLDED);
    }

    private announceWinners() {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
        const winners = this.getValidWinners(this.getAlivePlayers());

        pokerRoom.chatManager.postChat(`**[GAME]** Winner(s): **${winners.map(winner => winner.username).join(', ')}**`);
        const awardMessage = winners.length > 1 ? `$${pokerRoom.winningPool / winners.length} cash awarded to each winner.` : `$${pokerRoom.winningPool / winners.length} cash awarded to winner.`;
        pokerRoom.chatManager.postChat(`**[GAME]** ${awardMessage}`);
    }

    private revealPlayerHands() {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
        let revealMessage: string = '';
        const playersAlive = this.getAlivePlayers();

        for (const player of playersAlive.asArray()) {
          const allCards = new List<Cards>();
          allCards.addAll(player.hand.concat(pokerRoom.cardsManager.communityCards));
          revealMessage += `**${player.username}** had a **${getHandType(allCards).replace('_', ' ').toUpperCase()}** - ${player.hand.toString().replace('[', '').replace(']', '').replaceAll('.png', '').replaceAll(',', ', ')}\n`;
        }

        pokerRoom.eventManager.sendEvent(revealMessage);
    }

    private tryStartNewGame() {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);

        pokerRoom.chatManager.postChat('**[GAME]** Starting a new game in 20 seconds. Please wait.');
        pokerRoom.gameState = GameState.STARTING;

        setTimeout(async () => {
          this.handleNewGameStart();
        }, 20 * 1000);
    }

    private handleNewGameStart() {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);
        const playersAlive = this.getAlivePlayers();

        if (playersAlive.asArray().length >= 2 && pokerRoom.winningPool > 0) {
          this.resetGame();
          this.startNewGame();
        } else {
          this.handleGameEndCleanup(playersAlive);
        }
    }

    private resetGame() {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);

        pokerRoom.eventManager.sendEvent();
        pokerRoom.cardsManager.resetDrawnCards();
        pokerRoom.winningPool = 0;
        pokerRoom.lastBet = 0;
        pokerRoom.gamePhase = GamePhase.END;
        pokerRoom.gameState = GameState.RUNNING;
    }

    private startNewGame() {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);

        pokerRoom.cardsManager.sendCommunityCards([Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD])
        .then(() => {
          pokerRoom.chatManager.postChat('**[GAME]** Community cards updated.');
          pokerRoom.chatManager.postChat('**[GAME]** New game started!');
          pokerRoom.nextTurn();
        });
    }

    private handleGameEndCleanup(playersAlive: List<PokerPlayer>) {
      this.handleLoserBalances(playersAlive);
      this.announceGameDeletion();
    }

    private handleLoserBalances(playersAlive: List<PokerPlayer>) {
        const winners = this.getValidWinners(playersAlive);
        
        this.handleWinnerBalances(playersAlive);

        playersAlive.forEach(player => {
          if (!(winners.includes(player))) {
            this.handleLoserBalance(player);
          }
        });
    }

    private handleWinnerBalances(playersAlive: List<PokerPlayer>) {
        const winners = this.getValidWinners(playersAlive);

        winners.forEach(winner => {
          const user = PokerUser.findUserByUserName(winner.username);
          if (user) {
            user.balance += winner.cash;
            user.debt = winner.cash * 0.5;
            user.sync();

            saveStats(PokerUser.findUserByUserName(winner.username).userId, true, winner.cash - (winner.cash * 0.5));
          }
        });
    }

    private handleLoserBalance(player: PokerPlayer) {
      const user = PokerUser.findUserByUserName(player.username);
      if (user) {
        user.balance += player.cash;
        user.sync();

        saveStats(PokerUser.findUserByUserName(player.username).userId, false, 0);
      }
    }

    private announceGameDeletion() {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);

        pokerRoom.channel.send('**[GAME]** Game ended (lack of players/empty pot)...\nThis channel will be deleted in 60 seconds!');
        setTimeout(() => {
          PokerController.deleteRoom(pokerRoom);
        }, 60 * 1000);
    }
}

export default GameManager;