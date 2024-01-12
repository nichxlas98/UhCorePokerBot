import { Message, MessageEmbed, TextChannel } from "discord.js";
import PokerPlayer from '../../models/PokerPlayer';
import ConfigurationManager from '../../managers/ConfigManager';
import PokerController from "../PokerController";

class EventManager {
    private eventMessage: Message;
    private gameChannel: TextChannel;

    constructor(channel: TextChannel) {
        this.gameChannel = channel;
    }

    async sendEvent(message?: string) {
        if (message) {
            const embed = {
                title: `Game Event`,
                color: 0x0096FF,
                description: message
            }
        
            try {
                if (this.eventMessage) {
                    await this.eventMessage.edit({ embeds: [embed] });
                } else {
                    this.eventMessage = await this.gameChannel.send({ embeds: [embed] });
                }
            } catch (ignored) {} // Error caused by the channel being deleted.
            return;
        }

        if (this.eventMessage) {
            const embed = {
                title: `Game Event`,
                color: 0x0096FF,
                description: 'No message provided.'
            }
            try {
                await this.eventMessage.edit({ embeds: [embed] });
            } catch (ignored) {}
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

    async deleteEvent() {
        if (this.eventMessage) {
            await this.eventMessage.delete();
            this.eventMessage = undefined;
        }
    }
}

export default EventManager;