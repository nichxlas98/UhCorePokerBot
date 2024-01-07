import { Cards, HandTypes } from "../enums/Cards";
import List from "../models/List";
import PokerPlayer from "../models/PokerPlayer";

export const getGameWinners = (players: List<PokerPlayer>, communityCards: Cards[]) => {
    const handQuality: Map<string, number> = new Map();

    for (const player of players.asArray()) {
        const hand = player.hand.concat(communityCards);
        const handAsList = new List<Cards>();
        handAsList.addAll(hand);

        const handType = getHandType(handAsList);
        handQuality.set(player.username, getHandQuality(handType));
    }

    // Sort players based on hand quality in descending order
    const sortedPlayers = players.asArray().sort((a, b) => handQuality.get(b.username)! - handQuality.get(a.username)!);

    if (sortedPlayers.length < 1) {
        return [];
    }

    // Find the highest hand quality
    const highestQuality = handQuality.get(sortedPlayers[0].username);

    // Filter out the winners with the highest hand quality
    const winners = sortedPlayers.filter(player => handQuality.get(player.username) === highestQuality);

    // If there's more than one winner, return the user(s) with the highest cards total
    if (winners.length > 1) {
        const winnersCardTotals = winners.map(player => calculateCardTotal(List.from(player.hand)));
        const maxCardTotal = Math.max(...winnersCardTotals);

        // Filter winners with the highest card total
        return winners.filter((player, index) => winnersCardTotals[index] === maxCardTotal);
    }

    return winners;
};

const calculateCardTotal = (cards: List<Cards>): number => {
    // Convert face cards to numerical values for comparison
    const cardValues: Record<string, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
    };

    // Sum the numerical values of all cards in the hand
    return cards.reduce((total, card) => total + cardValues[getRank(card)], 0);
};

const getHandQuality = (handType: HandTypes): number => {
    switch(handType) {
        case HandTypes.ROYAL_FLUSH:
            return 100;
        case HandTypes.STRAIGHT_FLUSH:
            return 90;
        case HandTypes.FOUR_OF_A_KIND:
            return 80;
        case HandTypes.FULL_HOUSE:
            return 70;
        case HandTypes.FLUSH:
            return 60;
        case HandTypes.STRAIGHT:
            return 50;
        case HandTypes.THREE_OF_A_KIND:
            return 40;
        case HandTypes.TWO_PAIR:
            return 30;
        case HandTypes.PAIR:
            return 20;
        case HandTypes.HIGH_CARD:
            return 10;
    }
}

export const getHandType = (hand: List<Cards>): HandTypes => {
    if (isRoyalFlush(hand)) {
        return HandTypes.ROYAL_FLUSH;
    }

    if (isStraightFlush(hand)) {
        return HandTypes.STRAIGHT_FLUSH;
    }

    if (isFourOfAKind(hand)) {
        return HandTypes.FOUR_OF_A_KIND;
    }

    if (isFullHouse(hand)) {
        return HandTypes.FULL_HOUSE;
    }

    if (isFlush(hand)) {
        return HandTypes.FLUSH;
    }

    if (isStraight(hand)) {
        return HandTypes.STRAIGHT;
    }

    if (isThreeOfAKind(hand)) {
        return HandTypes.THREE_OF_A_KIND;
    }

    if (isTwoPair(hand)) {
        return HandTypes.TWO_PAIR;
    }

    if (isOnePair(hand)) {
        return HandTypes.PAIR;
    }

    return HandTypes.HIGH_CARD;
};

const isRoyalFlush = (hand: List<Cards>): boolean => {
    return (
        hand.contains(Cards.ACE_CLUBS) &&
        hand.contains(Cards.QUEEN_CLUBS) &&
        hand.contains(Cards.KING_CLUBS) &&
        hand.contains(Cards.JACK_CLUBS) &&
        hand.contains(Cards.TEN_CLUBS)
    ) || (
        hand.contains(Cards.ACE_SPADES) &&
        hand.contains(Cards.QUEEN_SPADES) &&
        hand.contains(Cards.KING_SPADES) &&
        hand.contains(Cards.JACK_SPADES) &&
        hand.contains(Cards.TEN_SPADES)
    ) || (
        hand.contains(Cards.ACE_HEARTS) &&
        hand.contains(Cards.QUEEN_HEARTS) &&
        hand.contains(Cards.KING_HEARTS) &&
        hand.contains(Cards.JACK_HEARTS) &&
        hand.contains(Cards.TEN_HEARTS)
    ) || (
        hand.contains(Cards.ACE_DIAMONDS) &&
        hand.contains(Cards.QUEEN_DIAMONDS) &&
        hand.contains(Cards.KING_DIAMONDS) &&
        hand.contains(Cards.JACK_DIAMONDS) &&
        hand.contains(Cards.TEN_DIAMONDS)
    );
};

const isStraightFlush = (hand: List<Cards>): boolean => {
    const rankCount: Map<string, number> = new Map();
    const suitCount: Map<string, number> = new Map();

    hand.forEach(card => {
        const rank = getRank(card);
        const suit = getSuit(card);

        const count = rankCount.get(rank) || 0;
        rankCount.set(rank, count + 1);

        const suitCountValue = suitCount.get(suit) || 0;
        suitCount.set(suit, suitCountValue + 1);
    });

    for (const suit of suitCount.keys()) {
        if (suitCount.get(suit) === 5) {
            const sortedRanks = Array.from(rankCount.keys()).sort();
            const straightRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];

            if (JSON.stringify(sortedRanks) === JSON.stringify(straightRanks)) {
                return true;
            }
        }
    }

    return false;
};

const isFourOfAKind = (hand: List<Cards>): boolean => {
    const rankCount: Map<string, number> = new Map();

    hand.forEach(card => {
        const rank = getRank(card);
        const count = rankCount.get(rank) || 0;
        rankCount.set(rank, count + 1);
    });

    for (const count of rankCount.values()) {
        if (count === 4) {
            return true;
        }
    }

    return false;
};

const isFullHouse = (hand: List<Cards>): boolean => {
    const rankCount: Map<string, number> = new Map();
    let hasThreeOfAKind = false;
    let hasPair = false;

    hand.forEach(card => {
        const rank = getRank(card);
        const count = rankCount.get(rank) || 0;
        rankCount.set(rank, count + 1);
    });

    for (const count of rankCount.values()) {
        if (count === 3) {
            hasThreeOfAKind = true;
        } else if (count === 2) {
            hasPair = true;
        }
    }

    return hasThreeOfAKind && hasPair;
};

const isFlush = (hand: List<Cards>): boolean => {
    const suitCount = [0, 0, 0, 0];

    hand.forEach(card => {
        if (card.includes('clubs')) {
            suitCount[0]++;
        } else if (card.includes('spades')) {
            suitCount[1]++;
        } else if (card.includes('hearts')) {
            suitCount[2]++;
        } else if (card.includes('diamonds')) {
            suitCount[3]++;
        }
    });

    return suitCount.some(count => count === 5);
};

const isStraight = (hand: List<Cards>): boolean => {
    let rankCount: Map<string, number> = new Map();
    hand.forEach(card => {
        const rank = getRank(card);
        if (rankCount.has(rank)) {
            rankCount.set(rank, rankCount.get(rank) + 1);
        } else {
            rankCount.set(rank, 1);
        }
    });

    const sortedRanks = Array.from(rankCount.keys()).sort();
    const straightRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];

    return JSON.stringify(sortedRanks) === JSON.stringify(straightRanks);
};

const isThreeOfAKind = (hand: List<Cards>): boolean => {
    const rankCount: Map<string, number> = new Map();

    hand.forEach(card => {
        const rank = getRank(card);
        rankCount.set(rank, (rankCount.get(rank) || 0) + 1);
    });

    return Array.from(rankCount.values()).some(count => count === 3);
};

const isTwoPair = (hand: List<Cards>): boolean => {
    const rankCount: Map<string, number> = new Map();

    hand.forEach(card => {
        const rank = getRank(card);
        rankCount.set(rank, (rankCount.get(rank) || 0) + 1);
    });

    return Array.from(rankCount.values()).some(count => count === 2);
};

const isOnePair = (hand: List<Cards>): boolean => {
    const rankCount: Map<string, number> = new Map();

    hand.forEach(card => {
        const rank = getRank(card);
        rankCount.set(rank, (rankCount.get(rank) || 0) + 1);
    });

    return Array.from(rankCount.values()).some(count => count === 2);
};

const getRank = (card: Cards): string => {
    return card.split('_')[0];
};

const getSuit = (card: Cards): string => {
    return card.split('_')[1].replace('.png', '');
};