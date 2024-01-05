import { Cards } from "../enums/Cards";
import { PlayerAction, PlayerState } from "../enums/States";

class PokerPlayer {

    public index: number;

    public username: string;
    public hand: Cards[];
    public cash: number;

    public currentBet: number = 0;

    public isPlayersTurn: boolean;
    public playerState: PlayerState;
    public lastAction: PlayerAction = PlayerAction.START;

    public actions: number = 0;
    public turns: number = 0;

    constructor(index: number, username: string, hand: Cards[], cash: number) {
        this.index = index;
        this.username = username;
        this.hand = hand;
        this.cash = cash;
        this.currentBet = 0;
        this.isPlayersTurn = false;
        this.playerState = PlayerState.WAITING;
    }
}

export default PokerPlayer;