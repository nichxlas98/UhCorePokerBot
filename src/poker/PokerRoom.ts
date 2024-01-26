import { Message, MessageEmbed, TextChannel } from "discord.js";
import List from "../models/List";
import PokerUser from "../models/PokerUser";
import { GamePhase, GameState, PlayerAction, PlayerState } from "../enums/States";
import { getUrlFromImages } from "../render";
import { Cards } from "../enums/Cards";
import PokerPlayer from "../models/PokerPlayer";
import exp from "constants";
import { getGameWinners, getHandType } from "../utils/CalculateUtils";
import ConfigurationManager from "../managers/ConfigManager";
import { saveGame, saveStats } from "../data/database";
import { LogManager } from "../managers/LogManager";
import ChatManager from "./managers/ChatManager";
import EventManager from "./managers/EventManager";
import CardsManager from "./managers/CardsManager";
import GameManager from "./managers/GameManager";
import PokerController from "./PokerController";

class PokerRoom {
    public channel: TextChannel;
    public chatManager: ChatManager;
    public eventManager: EventManager;
    public cardsManager: CardsManager;
    public gameManager: GameManager;
    
    public gameId: string;
    public joined: List<string> = new List<string>();;
    public joinCash: Map<string, number> = new Map<string, number>();
    public players: List<PokerPlayer> = new List<PokerPlayer>();

    public gamePhase: GamePhase;
    public gameState: GameState;

    public lastBet: number = 0;
    public winningPool: number = 0;

    public turn: number = 0;
    public lastTurn: number = 0;

    public autoFoldTimeout: string | number | NodeJS.Timeout;
    private waitingTimeout: string | number | NodeJS.Timeout;

    constructor(gameId: string, channel: TextChannel) {
        this.gameId = gameId;
        this.gameState = GameState.WAITING;
        this.channel = channel;
        
        this.gameManager = new GameManager(this.gameId);
        this.chatManager = new ChatManager(channel, this.gameId);
        this.eventManager = new EventManager(channel);
        this.cardsManager = new CardsManager();

        PokerController.createRoom(this);
        this.initializeTable();
    }

    private async initializeTable() {
        const waitTime = 60 * 3;
        await this.cardsManager.sendCommunityCards(Array(5).fill(Cards.DEFAULT_CARD));
        await this.chatManager.postChat('**[GAME]** Community cards updated.');
        await this.chatManager.postChat('**[GAME]** Waiting for players...');
        await this.eventManager.timer(waitTime, 'Waiting for players...');

        this.waitingTimeout = setTimeout(() => {
            this.checkState();
        }, waitTime * 1000);
    }

    private async waitForPlayersAndStartGame() {
        const startTime = 20;

        await this.eventManager.timer(startTime, 'Starting game...');
        setTimeout(() => {
            this.gameState = GameState.RUNNING;
            this.gamePhase = GamePhase.BLIND;
            this.chatManager.postChat('**[GAME]** Game started!');
            this.eventManager.deleteEvent();

            for (const player of this.joined.asArray()) {
                const newPlayer = new PokerPlayer(this.players.length(), player, [], this.joinCash.get(player));

                newPlayer.playerState = PlayerState.PLAYING;
                this.players.add(newPlayer);
            }

            this.nextTurn();
        }, startTime * 1000);
    }

    private async waitAndCheckState(seconds: number) {
        await this.chatManager.postChat(`**[GAME]** Not enough players to start.`);
        await this.eventManager.timer(seconds, `Waiting for players...`)
        this.waitingTimeout = setTimeout(() => {
            this.checkState();
        }, seconds * 1000);
    }

    checkState() {
        if (this.gameState === GameState.WAITING) {
            if (this.joined.length() < 2) {
                this.waitAndCheckState(30);
                return;
            }

            this.waitForPlayersAndStartGame();
        }
    }

    public checkIfAllPlayersFoldedOrQuit(player?: PokerPlayer) {
        let hasAllPlayersFolded = 0;
        this.players.forEach(player => {
            if (player.playerState === PlayerState.FOLDED || player.playerState === PlayerState.QUIT) {
                hasAllPlayersFolded++;
            }
        });

        if (hasAllPlayersFolded === this.players.length() - 1 || hasAllPlayersFolded === this.players.length()) {
            this.gamePhase = GamePhase.END;
            this.gameManager.handleNewRound(this.gamePhase);
            return;
        }

        if (player) this.nextTurn(player);
    }

    autoFold(username: string) {
        if (this.gamePhase === GamePhase.END) {
            return;
        }

        const updatedPlayer = this.players.find(p => p.username === username);

        if (updatedPlayer.isPlayersTurn && updatedPlayer.actions < updatedPlayer.turns) {
            updatedPlayer.lastAction = PlayerAction.FOLD;
            updatedPlayer.playerState = PlayerState.FOLDED;

            this.players.addOrReplaceAtIndex(this.players.findIndex(p => p.username === username), updatedPlayer);
            const newPlayer = this.players.find(p => p.username === username);

            this.chatManager.postChat(`**[GAME]** **${newPlayer.username}** folded.`);
            this.checkIfAllPlayersFoldedOrQuit(newPlayer);
        }
    }

    nextTurn(lastPlayer?: PokerPlayer) {
        clearTimeout(this.autoFoldTimeout);
        if (this.turn === 0) {
            this.gameManager.handleNewRound(); // If the round is just starting, generate the cards etc.
            if (lastPlayer && this.gamePhase === GamePhase.BLIND) {
                this.chatManager.sendTurnMessage(lastPlayer, `They need to place their starting bet (/call or /raise). \nThe minimum bet is $50.`);
            }
        }

        if (this.gamePhase === GamePhase.PRE_FLOP && this.turn === 0) {
            this.eventManager.sendEvent('All players have been given their hand. (use /hand to view it)');

            setTimeout(() => {
                this.eventManager.sendEvent();
            }, 10 * 1000)
        }

        if (this.gamePhase === GamePhase.END) {
            return;
        }

        this.lastTurn = this.turn;
        const player = this.players.get(this.turn);
        if (!player) {
            // Player doesn't exist anymore, skip them.
            this.turn = (this.turn + 1) % this.joined.length();
            this.nextTurn(lastPlayer);
            return;
        }

        for (const p of this.players.asArray()) {
            if (p.username !== player.username) {
                p.isPlayersTurn = false;
            }
        }

        if (player.playerState === PlayerState.FOLDED || player.playerState === PlayerState.QUIT || player.playerState === PlayerState.BUSTED || player.lastAction === PlayerAction.ALL_IN) {
            // Player quit or folded, skip them.
            if (player.lastAction === PlayerAction.ALL_IN) {
                this.chatManager.postChat(`**[GAME]** **${player.username}** is all-in. Their turn was skipped.`);
            }

            this.turn = (this.turn + 1) % this.joined.length();
            this.nextTurn(lastPlayer);
            return;
        }

        player.turns++;
        player.isPlayersTurn = true;
        let expectedAction: string;
        
        // Handle the blind phase, make players place their starting bets.
        if (this.gamePhase === GamePhase.BLIND) {
            let raiseOrCall = lastPlayer && lastPlayer.currentBet > 0 ? '`/call` or `/raise <amount>`' : '`/raise <amount>`';
            
            expectedAction = `They need to place their starting bet (/call or /raise). \nThe minimum bet is $50.`;
            this.chatManager.sendTurnMessage(player, expectedAction);

            this.turn = (this.turn + 1) % this.joined.length();
            return;
        }

        // Handle the flop, turn, and river.
        if (this.gamePhase === GamePhase.PRE_FLOP || this.gamePhase === GamePhase.FLOP || this.gamePhase === GamePhase.TURN || this.gamePhase === GamePhase.RIVER) {
            let canCheck = this.turn === 0 ? 'They can either check, raise, or fold.' : 'They can either call, raise or fold.';
            expectedAction = `${canCheck}`;

            this.chatManager.sendTurnMessage(player, expectedAction);

            this.turn = (this.turn + 1) % this.joined.length();
        }
    }

    join(username: string, cash: number) {
        this.joined.add(username);
        this.joinCash.set(username, cash);
        this.channel.permissionOverwrites.edit(PokerUser.findUserByUserName(username)!.userId, {
            VIEW_CHANNEL: true
        });

        this.chatManager.postChat(`**[GAME]** ${username} joined the game room.`);
    }

    leave(username: string) {
        this.joined.remove(username);
        this.channel.permissionOverwrites.edit(PokerUser.findUserByUserName(username)!.userId, {
            VIEW_CHANNEL: false
        });
        
        this.chatManager.postChat(`**[GAME]** ${username} left the game room.`);    
        const player = this.players.find(player => player.username === username);
        const pokerUser = PokerUser.findUserByUserName(username)!;
        if (player) {
            pokerUser.balance += player!.cash;
            player.playerState = PlayerState.QUIT;
        } else pokerUser.balance += this.joinCash.get(username)!;

        pokerUser.sync();
        saveStats(PokerUser.findUserByUserName(username)!.userId, false, 0);
        if (this.gameState === GameState.STARTING || this.gameState === GameState.RUNNING) {
            if (this.gamePhase !== GamePhase.END) this.checkIfAllPlayersFoldedOrQuit(this.players.find(player => player.username === username));
        }
    }

    chat(username: string, message: string) {
        this.chatManager.postChat(`**[CHAT]** ${username}: ${message}`);
    }

    start() {
        clearTimeout(this.waitingTimeout);
        this.gameState = GameState.STARTING;
        this.waitForPlayersAndStartGame();
    }

}

export default PokerRoom;
