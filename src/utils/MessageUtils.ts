import { MessageEmbed } from "discord.js"

export const getErrorEmbed = (error: string): MessageEmbed => {
    return new MessageEmbed()
            .setTitle('Error!')
            .setDescription(`${error}`)
            .setColor(0xFF3333)
};

export const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const formattedDate = `${date.getUTCDate().toString().padStart(2, '0')}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}-${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}:${date.getUTCSeconds().toString().padStart(2, '0')}`;
    return formattedDate;
}