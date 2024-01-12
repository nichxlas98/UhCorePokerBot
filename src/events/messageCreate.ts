import PokerRoom from "../poker/PokerRoom";
import PokerUser from "../models/PokerUser";
import { Event } from "../structures/Event";
import PokerController from "../poker/PokerController";

export default new Event("messageCreate", async (message) => {
    if (message.author.bot) {
        return;
    }

    if (!message.guild) {
        return;
    }

    const sender = message.author;
    const pokerUser = PokerUser.findUserByUserId(sender.id);
    if (!pokerUser || !pokerUser.verified) {
        return;
    }

    const foundTable = PokerController.getRooms().find(table => table.joined.contains(pokerUser.userName));
    if (!foundTable) {
        const sentInPokerRoom = PokerController.getRooms().find(table => table.gameId === message.channel.id);

        if (sentInPokerRoom)  await message.delete();
        return;
    }

    const specialCharacters = ['*', '`', '#', '~', '_', '|', '\n'];
    const content = message.content.replaceAll(new RegExp(`[${specialCharacters.join('')}]`, 'g'), '');
    if (foundTable.channel.id === message.channel.id) {
        await message.delete();
        foundTable.chat(pokerUser.userName, content);
    }
});