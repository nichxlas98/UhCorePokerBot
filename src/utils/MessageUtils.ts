import { MessageEmbed } from "discord.js"

export const getErrorEmbed = (error: string): MessageEmbed => {
    return new MessageEmbed()
            .setTitle('Error!')
            .setDescription(`${error}`)
            .setColor(0xFF3333)
};