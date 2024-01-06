import { Client, TextChannel } from "discord.js";
import { initializeDatabase, initializeUsers } from "../data/database";
import { LogManager } from "../managers/LogManager";
import { Event } from "../structures/Event";
import { getErrorEmbed } from "../utils/MessageUtils";

const sendInformationMessage = async (client: Client) => {
    const guild = client.guilds.cache.get('1191502369154945115');
    const channel = guild.channels.cache.get('1192488346329559120');

    (channel as TextChannel).send({ embeds: [
        { 
            title: "Welcome to Costi's Game Club!", 
            description: "**About Us**\n(unavailable)\n\n**Fully licensed and regulated**\nWe are a licensed and registered legal business, and abide by all laws and regulations where we do business.\n\nWe strongly believe in [Responsible Gaming](<https://i.imgur.com/55jIn3l.png>) and offer a number of tools that are designed to give our customers full control.",
            color: 0x237FEB,
            image: {
                url: 'https://i.imgur.com/jW9zD1u.jpg'
            }
        },
        {
            title: "Information/FAQ", 
            description: "## **How does this work?**\n(( For now, this acts as an intranet for an off-the-books gaming establishment with various locations around Red County (soon to be announced). \n\nThe general concept is the following; inside one of these establishments (while we're open), you'll have access to a variety of different machines which lets you utilize the actual website (this discord) to gamble and play poker. \n(more games to be added in the future)\n\nWhile the establishment's closed/if you aren't at the actual establishment during its opening, the website is inaccessible. ))\n\n## **Why isn't it fully online/always accessible?**\n**((** At the moment, it's not fully feasible to have it accessible 100% of the time, because we won't be able to ensure that it stays as an actual working gambling function. We need to be able to ensure it stays fair, and people actually receive what they win or pay what they lose, otherwise it'd be very difficult to keep players interested/playing.\n\nAnother reason this needs to take place partly in-game is to ensure activity and motivation. As an actual event, it'll reel in players which intern would lead to far more active poker games, which is a lot more fun than playing stagnant two-three player games. **))**\n\n## **How do I get access/verify an account?**\n**((** To verify an account, you'll need use the command `/request` inside the [verify channel](<https://discord.com/channels/1191502369154945115/1192486674916184175>) — it's suggested you do this early on, so you won't need to get verified during an opening.\n\nYou should use the character you intend to visit the establishment on since in order to withdraw/deposit funds into an account, you'll need to show up at an opening and actually pay with that character. **))**\n\n## **What happens if I win a poker game?**\nOnce you've won a game, you can choose when you wish to withdraw your winnings from your account by simply heading to the host of the opening, and requesting a withdrawal. They'll give you your winnings in full and then they'll update the balance on your account.\n\n## **What are the fees associated with playing?**\nAs of now, the **only** two fees associated with playing is the \"__playing fee__\", and the \"__winners fee__\" which often amounts to less than $100 per game.\n\nThe __playing fee__ amounts to 10% of the cash you join a game with. For example, if you join a poker room with $300, the fee would be $30, which you'll only be charged once you withdraw your balance from your account.\n\nThe __winners fee__ amounts to 5% of the winnings you make during a game. For example, if you win a pot of **$1,000**, the winners fee would be $50 from that, which you'll only be charged once you withdraw your balance from your account.\n\n**((** Do note, all fees are 100% automatically calculated and handled by the Poker Bot. **))**",
            color: 0x59CBFF,
            image: {
                url: 'https://i.imgur.com/9zs2WWD.png'
            }
        }
    ]});
};

const sendHelpMessage = async (client: Client) => {
    const channel = await client.channels.fetch('1192565190017945630');
    (channel as TextChannel).send({ embeds: [
        { 
            title: "Helpful Information", 
            description: "## **How can I verify my account?**\nTo verify an account, you'll need to use the command `/request` inside the [verify channel](<https://discord.com/channels/1191502369154945115/1192486674916184175>).\n## **How do I play?**\nIt's practically regular Texas Hold 'Em poker. You can view a list of running games via the `/games` command, wherein you copy the [Room ID](<https://i.imgur.com/LVCHIaA.png>) of the game you wish to join, and use the command `/joingame`, you'll then provide the Room ID, and the cash you wish to join with (must be within the balance you have in your account).\n\nOnce you're in, you'll have to wait a short period for the other players to join, once they do, it'll automatically start the game. If you aren't familiar with how to play Poker, there's plenty of online tutorials to learn from, and it's **incredibly easy** (for reference, the developer of this poker system has never played an official game of poker before).\n\nNow, once the game starts, you can then begin betting utilizing the various commands such as:\n\n`/chat` - Allows you to send messages within the game chat to other players.\n\n`/raise` - Allows you to increase the size of an existing bet in the same betting round, or place a starting bet if you haven't already.\n`/call` - Allows you to match a bet or match a raise.\n`/check` - Allows you to pass one's betting option for the time being, with the action then moving to the next player. \n`/allin` - Allows you to bet the entirety of your game cash.\n`/fold` - Allows you to discard one's hand and forfeit interest in the current pot.\n`/hand` - Allows you to view your hand and current game cash. (It's ephemeral, as is all commands, so only you can see your hand)\n\nIf you wish to leave an ongoing game at any time, you may use `/leavegame`. — Keep in mind, you'll lose any existing cash you've bet in the pot, but don't worry! You'll still keep your game cash that you hadn't already bet during the game.\n\nThroughout the rounds, the community cards will be dealt as normal. If you run into any bugs, or issues, please do report them via the [bug-tracker channel](<https://discord.com/channels/1191502369154945115/1192565190017945630>). We'll happily refund whatever's lost to a proven issue, just make sure you document it accordingly and report it via the proper means. `/reportissue`.",
            color: 0x59CBFF,
            image: {
                url: 'https://i.imgur.com/jW9zD1u.jpg'
            }
        }
    ]});
};

export default new Event("ready", async (client) => {
    client.user.setAvatar('https://i.imgur.com/nX8IbmD.jpg');
    client.user.setPresence({ 
        status: 'online',
        activities: [{ 
            name: 'www.costi-club.com', 
            type: "WATCHING", 
        }]
    });

    const logger = LogManager.getInstance();
    logger.log(`Bot is online under the name: ${client.user.username}, ID: ${client.user.id}`);

    const channel = await client.channels.fetch('1192486674916184175');

    (channel as TextChannel).messages.fetch({ limit: 10 }).then(async (messages) => {
        messages.forEach(async (message) => {
            if (message.embeds[0].title === 'Account Request') {
                await message.reply(`<@${message.author.id}>'s account has been registered successfully!'`);
            }
        });
        
    });

    await initializeUsers();
    await initializeDatabase(client);
});