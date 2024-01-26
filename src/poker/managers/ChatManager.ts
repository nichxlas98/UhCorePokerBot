import { Message, MessageEmbed, TextChannel } from 'discord.js';
import List from '../../models/List';
import PokerRoom from '../PokerRoom';
import PokerController from '../PokerController';
import PokerPlayer from '../../models/PokerPlayer';
import ConfigurationManager from '../../managers/ConfigManager';

class ChatManager {
    private gameChat: List<string>; 
    private gameChannel: TextChannel;
    private gameMessage: Message;
    private turnMessage: Message;

    constructor(channel: TextChannel, private gameId: string) {
        this.gameChat = new List<string>();
        this.gameChannel = channel;
    }

    public getGameChat(): List<string> {
        return this.gameChat;
    }

    private splitMessageIntoChunks(message: string, chunkSize: number): string[] {
        const messageChunks = [];

        for (let i = 0; i < message.length; i += chunkSize) {
            messageChunks.push(message.slice(i, i + chunkSize));
        }

        return messageChunks;
    }

    private formatMessages(messages: string[]): string {
        const maxCharactersPerMessage = 59;

        const formattedMessages = messages.reduce((result, msg) => {
            if (msg.length > maxCharactersPerMessage) {
                const chunks = this.splitMessageIntoChunks(msg, maxCharactersPerMessage);
                result.push(...chunks);
            } else {
                result.push(msg);
            }
            return result;
        }, []);

        return formattedMessages.join('');
    }

    private createEmbed(): MessageEmbed {
        const pokerRoom = PokerController.getRooms().find(table => table.gameId === this.gameId);

        return new MessageEmbed()
            .setTitle(`Game Room — (${this.gameId})`)
            .setColor(0x0096FF)
            .setImage(pokerRoom.cardsManager ? pokerRoom.cardsManager.communityCardsUrl : '');
    }

    async postChat(message?: string) {
        if (!message) return;

        const messageChunks = this.splitMessageIntoChunks(message, 59);
        messageChunks.forEach(chunk => this.gameChat.add(chunk + '\n'));

        const allMessages = this.gameChat.asArray();
        const last10Messages = allMessages.slice(-10);
        const description = this.formatMessages(last10Messages);

        const embed = this.createEmbed();

        try {
            
            if (this.gameMessage) {
                await this.gameMessage.edit({ content: description, embeds: [embed] });
            } else {
                this.gameMessage = await this.gameChannel.send({ content: description, embeds: [embed] });
            }
        } catch (ignored) {}
    }

    async sendTurnMessage(player: PokerPlayer, expectedAction: string) {
        const pokerRoom = PokerController.getInstanceById(this.gameId);
        const now = new Date();
        const futureTime = new Date(now.getTime() + 120 * 1000);
        const timestamp = Math.floor(futureTime.getTime() / 1000);

        const config = new ConfigurationManager().loadConfig();

        const embed = new MessageEmbed()
        .setTitle(`TURN — ${player.username}`)
        .setColor(0x808080)
        .setDescription(`It's ${player.username}'s turn!\n${expectedAction}`)
        .addFields({ name: 'Round', value: `The ${pokerRoom.gamePhase}`, inline: true }, { name: 'Stack', value: `$${player.cash}`, inline: true }, { name: 'Time Left', value: `They'll auto-fold <t:${timestamp}:R>`, inline: true }, { name: 'Players', value: `${pokerRoom.players.length()}/${config.maxPlayers}`, inline: true }, { name: 'Pot', value: `$${pokerRoom.winningPool}`, inline: true });

        if (!this.turnMessage) {
            this.turnMessage = await pokerRoom.channel.send({ embeds: [embed] });
        } else {
            await this.turnMessage.edit({ embeds: [embed] });
        }

        pokerRoom.autoFoldTimeout = setTimeout(() => {
            pokerRoom.autoFold(player.username);
        }, 120 * 1000);
    }
}

export default ChatManager;