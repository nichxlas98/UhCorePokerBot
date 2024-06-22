import {
    ApplicationCommandDataResolvable,
    Client,
    ClientEvents,
    Collection,
    ActivityType
} from "discord.js";
import { CommandType } from "../typings/Command";
const glob = require("glob");
import { promisify } from "util";
import { RegisterCommandsOptions } from "../typings/client";
import { Event } from "./Event";
import { LogManager } from "../managers/LogManager";


const globPromise = glob.sync;

export class ExtendedClient extends Client {
    commands: Collection<string, CommandType> = new Collection();

    constructor() {
        super({ intents: 32767 });
    }

    start() {
        this.registerModules();
        this.login(process.env.botToken);
    }
    async importFile(filePath: string) {
        return (await import(filePath))?.default;
    }

    async registerCommands({ commands, guildId }: RegisterCommandsOptions) {
        const logger = LogManager.getInstance();
        if (guildId) {
            this.guilds.cache.get(guildId)?.commands.set(commands);
            logger.log(`Registering commands to ${guildId}`);
        } else {
            this.application?.commands.set(commands);
            logger.log("Registering global commands");
        }
    }

    async registerModules() {        
        // Commands
        const slashCommands: ApplicationCommandDataResolvable[] = [];
        const commandFiles = globPromise(
            `${__dirname}/../commands/*/*{.ts,.js}`
        );
        for (const filePath of commandFiles) {
            const command: CommandType = await this.importFile(filePath);
            if (!command) {
                console.log(`Invalid command specified in ${filePath}`);
                continue;
            }
            if (!command.name) continue;

            console.log(command);

            this.commands.set(command.name, command);
            slashCommands.push(command);
        }

        this.on("ready", () => {
            this.registerCommands({
                commands: slashCommands,
                guildId: process.env.guildId
            });
        });

        // Event
        const eventFiles = globPromise(
            `${__dirname}/../events/*{.ts,.js}`
        );
        for (const filePath of eventFiles) {
            const event: Event<keyof ClientEvents> = await this.importFile(
                filePath
            );
            this.on(event.event, event.run);
        }
    }
}
