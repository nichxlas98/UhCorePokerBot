import { Cards } from "../../enums/Cards";
import List from "../../models/List";
import { getUrlFromImages } from "../../render";

class CardsManager {

    private drawnCards: List<Cards>; 
    public communityCards: Cards[];
    public communityCardsUrl: string;
    public hands: Map<string, string>;
    constructor() {
        this.drawnCards = new List<Cards>();
        this.communityCards = [];
        this.communityCardsUrl = '';
        this.hands = new Map<string, string>();
    }

    generateCard(): Cards {
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

    async sendCommunityCards(cards: Cards[]) {
        const cardsUrl = await getUrlFromImages(cards, 'output.png');
        this.communityCardsUrl = cardsUrl;
        this.communityCards = cards;
    }

    resetDrawnCards() {
        this.drawnCards.clear();
    }
}

export default CardsManager;