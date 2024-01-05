import PokerTable from "../models/PokerTable";
import PokerUser from "../models/PokerUser";
import { Event } from "../structures/Event";

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

    const foundTable = PokerTable.getTables().find(table => table.joined.contains(pokerUser.userName));
    if (!foundTable) {
        const sentInPokerRoom = PokerTable.getTables().find(table => table.gameId === message.channel.id);

        if (sentInPokerRoom)  await message.delete();
        return;
    }

    const content = message.content;
    if (foundTable.channel.id === message.channel.id) {
        await message.delete();
        foundTable.chat(pokerUser.userName, content);
    }
});