import { Event } from "../structures/Event";
import { Logger } from "../logs/Logger";
import { syncUser } from "../data/database";
import PokerUser from "../models/PokerUser";

export default new Event("guildMemberAdd", async (member) => {
    const guild = member.guild;
    if (guild.id !== process.env.guildId) {
        return;
    }

    const unknown = 'Unknown';
    new PokerUser(member.user.id, unknown, unknown, unknown, unknown, unknown, unknown, 0, false, 0, 0, Date.now()).sync();

    const unregisteredRole = guild.roles.cache.find(role => role.id === '1191654861238972446');
    member.roles.add(unregisteredRole);

    Logger.getInstance().log(`User joined: ${member.user.username} with ID: ${member.user.id}`, 1);
});