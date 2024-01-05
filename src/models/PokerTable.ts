import { Message, MessageEmbed, TextChannel } from "discord.js";
import List from "./List";
import PokerUser from "./PokerUser";
import { GamePhase, GameState, PlayerAction, PlayerState } from "../enums/States";
import { getUrlFromImages } from "../render";
import { Cards } from "../enums/Cards";
import PokerPlayer from "./PokerPlayer";
import exp from "constants";
import { getGameWinners, getHandType } from "../utils/CalculateUtils";

const tables = new List<PokerTable>();

class PokerTable {

    private static instance: PokerTable | null = null;

    public channel: TextChannel;
    private gameMessage: Message;

    public gameId: string;
    public joined: List<string>;
    public joinCash: Map<string, number> = new Map<string, number>();
    public players: List<PokerPlayer> = new List<PokerPlayer>();

    public hands: Map<string, string> = new Map<string, string>();

    public gameChat: List<string>;
    public gamePhase: GamePhase;
    public gameState: GameState;

    public drawnCards: List<Cards> = new List<Cards>();
    public lastBet: number = 0;
    public winningPool: number = 0;

    private communityCards: Cards[];
    private communityCardsUrl: string;

    private turnMessage: Message;
    private turn: number = 0; //TODO: start on implementing player turns, starting with starting bets, then pre flop bets, etc
    private lastTurn: number = 0;
    private currentPlayer: string = '';

    private eventMessage: Message;
    private autoFoldTimeout;

    constructor(gameId: string, channel: TextChannel) {
        this.gameId = gameId;
        this.joined = new List<string>();
        this.gameChat = new List<string>();
        this.gameState = GameState.WAITING;
        this.channel = channel;

        tables.add(this);

        this.initializeTable();
    }

    private async initializeTable() {
        const waitTime = 180;
        await this.sendCommunityCards([Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD]);
        await this.postChat('**[GAME]** Community cards updated.');
        await this.postChat('**[GAME]** Waiting for players...');
        await this.timer(waitTime, 'Waiting for players...');
        //await this.postChat(`**[GAME]** Waiting for players (<t:${timestamp}:R>)...`);

        setTimeout(() => {
            this.checkState();
        }, waitTime * 1000);
    }

    static getInstanceById(gameId: string): PokerTable | undefined {
        return tables.get(tables.findIndex(t => t.gameId === gameId)) as PokerTable;
    }

    static getTables(): List<PokerTable> {
        return tables;
    }

    async sendCommunityCards(cards: Cards[]) {
        const cardsUrl = await getUrlFromImages(cards, 'output.png');
        this.communityCardsUrl = cardsUrl;
        this.communityCards = cards;
    }

    async postChat(message?: string) {
        const maxCharactersPerMessage = 59;
        if (message) {
            
            const fullMessage = `${message}`;
            const messageChunks = [];
            
            for (let i = 0; i < fullMessage.length; i += maxCharactersPerMessage) {
                messageChunks.push(fullMessage.slice(i, i + maxCharactersPerMessage));
            }
        
            for (const chunk of messageChunks) {
                this.gameChat.add(chunk + '\n');
            }
        }
    
        const allMessages = this.gameChat.asArray();
        const last10Messages = allMessages.slice(-10);
        const formattedMessages = [];
    
        for (const msg of last10Messages) {
            if (msg.length > maxCharactersPerMessage) {
                const chunks = [];
                for (let i = 0; i < msg.length; i += maxCharactersPerMessage) {
                    chunks.push(msg.slice(i, i + maxCharactersPerMessage));
                }
                formattedMessages.push(...chunks);
            } else {
                formattedMessages.push(msg);
            }
        }
    
        const description = formattedMessages.join('');
    
        const embed = new MessageEmbed()
            .setTitle(`Game Room — (${this.gameId})`)
            .setColor(0x0096FF)
            .setDescription(description)
            .setImage(this.communityCardsUrl);
    
        if (this.gameMessage) {
            await this.gameMessage.edit({ embeds: [embed] });
        } else {
            this.gameMessage = await this.channel.send({ embeds: [embed] });
        }
    }

    async sendEvent(message?: string) {
        if (message) {
            const embed = {
                title: `Game Event`,
                color: 0x0096FF,
                description: message
            }
        
            if (this.eventMessage) {
                await this.eventMessage.edit({ embeds: [embed] });
            } else {
                this.eventMessage = await this.channel.send({ embeds: [embed] });
            }
            return;
        }

        if (this.eventMessage) {
            
            const embed = {
                title: `Game Event`,
                color: 0x0096FF,
                description: 'No message provided.'
            }
            await this.eventMessage.edit({ embeds: [embed] });
            

            // await this.eventMessage.delete();
            // this.eventMessage = undefined;
        }
    }

    async timer(timeLeft: number, message: string) {
        if (timeLeft === 0) {
            this.sendEvent();
            return;
        }

        const now = new Date();
        const futureTime = new Date(now.getTime() + timeLeft * 1000);
        const timestamp = Math.floor(futureTime.getTime() / 1000);
        
        this.sendEvent(`**[GAME]** ${message} (<t:${timestamp}:R>)`);
    }
    

    private async waitForPlayersAndStartGame() {
        const startTime = 20;
        await this.timer(startTime, 'Starting game...');
        setTimeout(() => {
            this.gameState = GameState.RUNNING;
            this.gamePhase = GamePhase.BLIND;
            this.postChat('**[GAME]** Game started!');
            this.eventMessage.delete();
            this.eventMessage = undefined;

            for (const player of this.joined.asArray()) {
                const newPlayer = new PokerPlayer(this.players.length(), player, [], this.joinCash.get(player));

                newPlayer.playerState = PlayerState.PLAYING;
                this.players.add(newPlayer);
            }

            this.nextPlayerTurn();
        }, startTime * 1000);
    }

    private async waitAndCheckState(seconds: number) {
        await this.postChat(`**[GAME]** Not enough players to start.`);
        await this.timer(seconds, `Waiting for players...`)
        setTimeout(() => {
            this.checkState();
        }, seconds * 1000);
    }

    private generateCard(): Cards {
        const allCards = Object.values(Cards);
    
        // Fisher-Yates shuffle algorithm
        for (let i = allCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
        }
    
        let randomCard: Cards;
    
        for (const card of allCards) {
            if (!this.drawnCards.contains(card) && card !== Cards.DEFAULT_CARD) {
                randomCard = card;
                break;
            }
        }
    
        if (randomCard) {
            this.drawnCards.add(randomCard);
            return randomCard;
        } else {
            // Handle the case when all cards have been drawn
            throw new Error("All cards have been drawn");
        }
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

    public checkIfAllPlayersFoldedOrQuit(player: PokerPlayer) {
        let hasAllPlayersFolded = 0;
        this.players.forEach(player => {
            if (player.playerState === PlayerState.FOLDED || player.playerState === PlayerState.QUIT) {
                hasAllPlayersFolded++;
            }
        });

        if (hasAllPlayersFolded === this.players.length() - 1) {
            this.gamePhase = GamePhase.END;
            this.handleNewRound();
            return;
        }

        this.nextPlayerTurn(player);
    }

    handleNewRound() {
        if (this.turn === 0 && this.lastTurn > 0) {
            switch (this.gamePhase) {
                case GamePhase.BLIND:
                    this.gamePhase = GamePhase.PRE_FLOP;
                    break;
                case GamePhase.PRE_FLOP:
                    this.gamePhase = GamePhase.FLOP;
                    break;
                case GamePhase.FLOP:
                    this.gamePhase = GamePhase.TURN;
                    break;
                case GamePhase.TURN:
                    this.gamePhase = GamePhase.RIVER;
                    break;
                case GamePhase.RIVER:
                    this.gamePhase = GamePhase.END;
                    break;
                case GamePhase.END:
                    this.gamePhase = GamePhase.BLIND;
                    break;
            }
        }

        if (this.gamePhase === GamePhase.BLIND) {
            return;
        }

        if (this.gamePhase === GamePhase.PRE_FLOP) {
            for (const player of this.players.asArray()) {
                player.hand = [this.generateCard(), this.generateCard()];
                getUrlFromImages(player.hand, 'output.png').then(url => {
                    this.hands.set(player.username, url);
                });
            }
            return;
        }

        if (this.gamePhase === GamePhase.FLOP) {
            this.sendCommunityCards([this.generateCard(), this.generateCard(), this.generateCard(), Cards.DEFAULT_CARD, Cards.DEFAULT_CARD])
            .then(() => {
                this.postChat('**[GAME]** Community cards updated.');
            });
            return;
        }

        if (this.gamePhase === GamePhase.TURN) {
            this.sendCommunityCards([this.communityCards[0], this.communityCards[1], this.communityCards[2], this.generateCard(), Cards.DEFAULT_CARD])
                .then(() => {
                    this.postChat('**[GAME]** Community cards updated.');
                });
            return;
        }

        if (this.gamePhase === GamePhase.RIVER) {
            this.sendCommunityCards([this.communityCards[0], this.communityCards[1], this.communityCards[2], this.communityCards[3], this.generateCard()])
                .then(() => {
                    this.postChat('**[GAME]** Community cards updated.');
                });
            return;
        }

        if (this.gamePhase === GamePhase.END) {
            this.postChat('**[GAME]** Game ended!');
            for (const player of this.players.asArray()) {
                if (player.cash === 0) {
                    player.playerState = PlayerState.BUSTED;
                    this.postChat(`**[GAME]** ${player.username} busted!`);
                    continue;
                }

                if (player.playerState === PlayerState.QUIT) {
                    continue;
                }

                player.playerState = PlayerState.PLAYING;
                player.lastAction = PlayerAction.START;
            }
            
            const playersAlive = new List<PokerPlayer>();
            playersAlive.addAll(this.players.asArray().filter(player => player.playerState !== PlayerState.QUIT && player.playerState !== PlayerState.BUSTED));

            const winners = getGameWinners(playersAlive, this.communityCards);
            winners.forEach(winner => {
                winner.cash += this.winningPool / winners.length;
            });

            this.postChat(`**[GAME]** Winner(s): **${winners.map(winner => winner.username).join(', ')}**`);
            if (winners.length > 1) {
                this.postChat(`**[GAME]** $${this.winningPool / winners.length} cash awarded to each winner.`);
            } else {
                this.postChat(`**[GAME]** $${this.winningPool / winners.length} cash awarded to winner.`);
            }

            let revealMessage: string = '';
            for (const player of playersAlive.asArray()) {
                const allCards = new List<Cards>();
                allCards.addAll(player.hand.concat(this.communityCards));
                revealMessage += `**${player.username}** had a **${getHandType(allCards).replace('_', ' ').toUpperCase()}** - ${this.hands.get(player.username)}\n`;
            }

            this.sendEvent(revealMessage);
            this.postChat('**[GAME]** Starting a new game in 20 seconds. Please wait.');
            setTimeout(() => {
                if (playersAlive.asArray().length >= 2 && this.winningPool > 0) {
                    this.sendEvent();
                    this.winningPool = 0;
                    this.lastBet = 0;
                    this.drawnCards = new List<Cards>();
                    this.gamePhase = GamePhase.END;
    
                    this.sendCommunityCards([Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD, Cards.DEFAULT_CARD])
                        .then(() => {
                            this.postChat('**[GAME]** Community cards updated.');
                            this.postChat('**[GAME]** New game started!');
                        });
                        
                    this.nextPlayerTurn();
                    return;
                }
    
                winners.forEach(winner => {
                    const user = PokerUser.findUserByUserName(winner.username);
                    if (!user) {
                        return;
                    }
    
                    user.balance += winner.cash - (winner.cash * 0.5);
                    user.debt = winner.cash * 0.5;
                    user.sync();
                });
    
                playersAlive.forEach(player => {
                    if (!(winners.includes(player))) {
                        const user = PokerUser.findUserByUserName(player.username);
                        if (!user) {
                            return;
                        }
    
                        user.balance += player.cash;
                        user.sync();
                    }
                });
    
                this.channel.send('**[GAME]** Game ended (lack of players/empty pot)...\nThis channel will be deleted in 60 seconds!');
                setTimeout(() => {
                    this.channel.delete();
                    tables.remove(this);
                }, 60 * 1000);
            }, 20 * 1000);
        }
    }

    async sendTurnMessage(player: PokerPlayer, expectedAction: string) {
        const now = new Date();
        const futureTime = new Date(now.getTime() + 120 * 1000);
        const timestamp = Math.floor(futureTime.getTime() / 1000);

        const embed = new MessageEmbed()
        .setTitle(`TURN — ${player.username}`)
        .setColor(0x808080)
        .setDescription(`It's ${player.username}'s turn!\n${expectedAction}`)
        .addFields({ name: 'Round', value: `The ${this.gamePhase}`, inline: true }, { name: 'Cash Left', value: `$${player.cash}`, inline: true }, { name: 'Time Left', value: `They'll auto-fold <t:${timestamp}:R>`, inline: true }, { name: 'Players', value: `${this.players.length()}/8`, inline: true }, { name: 'Pot', value: `$${this.winningPool}`, inline: true });

        if (!this.turnMessage) {
            this.turnMessage = await this.channel.send({ embeds: [embed] });
        } else {
            await this.turnMessage.edit({ embeds: [embed] });
        }

        this.autoFoldTimeout = setTimeout(() => {
            this.autoFold(player);
        }, 120 * 1000);
    }

    autoFold(player: PokerPlayer) {
        if (this.gamePhase === GamePhase.END) {
            return;
        }

        const updatedPlayer = this.players.find(p => p.username === player.username);

        if (updatedPlayer.isPlayersTurn && updatedPlayer.actions < updatedPlayer.turns) {
            player.lastAction = PlayerAction.FOLD;
            player.playerState = PlayerState.FOLDED;
            this.postChat(`**[GAME]** **${player.username}** folded.`);
            this.checkIfAllPlayersFoldedOrQuit(player);
        }
    }

    async nextPlayerTurn(lastPlayer?: PokerPlayer) {
        clearTimeout(this.autoFoldTimeout);
        if (this.turn === 0) {
            this.handleNewRound(); // If the round is just starting, generate the cards etc.
        }

        if (this.gamePhase === GamePhase.PRE_FLOP && this.turn === 0) {
            this.sendEvent('All players have been given their hand. (use /hand to view it)');

            setTimeout(() => {
                this.sendEvent();
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
            this.nextPlayerTurn(lastPlayer);
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
                this.postChat(`**[GAME]** **${player.username}** is all-in. Their turn was skipped.`);
            }

            this.turn = (this.turn + 1) % this.joined.length();
            this.nextPlayerTurn(lastPlayer);
            return;
        }

        player.turns++;
        player.isPlayersTurn = true;
        let expectedAction: string;
        
        // Handle the blind phase, make players place their starting bets.
        if (this.gamePhase === GamePhase.BLIND) {
            let raiseOrCall = lastPlayer && lastPlayer.currentBet > 0 ? '`/call` or `/raise <amount>`' : '`/raise <amount>`';
            
            expectedAction = `They need to place their starting bet (/call or /raise). \nThe minimum bet is $50.`;
            this.sendTurnMessage(player, expectedAction);

            this.turn = (this.turn + 1) % this.joined.length();
            return;
        }

        // Handle the flop, turn, and river.
        if (this.gamePhase === GamePhase.PRE_FLOP || this.gamePhase === GamePhase.FLOP || this.gamePhase === GamePhase.TURN || this.gamePhase === GamePhase.RIVER) {
            let canCheck = this.turn === 0 ? 'They can either check, raise, or fold.' : 'They can either call, raise or fold.';
            expectedAction = `${canCheck}`;

            this.sendTurnMessage(player, expectedAction);

            this.turn = (this.turn + 1) % this.joined.length();
        }
    }

    join(username: string, cash: number) {
        this.joined.add(username);
        this.joinCash.set(username, cash);
        this.channel.permissionOverwrites.edit(PokerUser.findUserByUserName(username)!.userId, {
            VIEW_CHANNEL: true
        });

        this.postChat(`**[GAME]** ${username} joined the table.`);
    }

    leave(username: string) {
        this.joined.remove(username);
        const player = this.players.find(player => player.username === username);
        this.channel.permissionOverwrites.edit(PokerUser.findUserByUserName(username)!.userId, {
            VIEW_CHANNEL: false
        });

        const pokerUser = PokerUser.findUserByUserName(username)!;
        pokerUser.balance += player!.cash;
        player.playerState = PlayerState.QUIT;

        this.postChat(`**[GAME]** ${username} left the table.`);
        this.checkIfAllPlayersFoldedOrQuit(this.players.find(player => player.username === username));
    }

    chat(username: string, message: string) {
        this.postChat(`**[CHAT]** ${username}: ${message}`);
    }

}

export default PokerTable;
