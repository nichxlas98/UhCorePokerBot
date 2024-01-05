import * as fs from 'fs';
import path from 'path';

interface Config {
  gameCreation: boolean;
  maxStart: number;
  maxRaise: number;
  minRaise: number;
  minStart: number;
  maxJoin: number;
  minJoin: number;
  maxPlayers: number;
}

export default class ConfigurationManager {
  private configFilePath: string;

  constructor() {
    this.configFilePath = path.resolve('../config/config.json');
  }

  loadConfig(): Config {
    try {
      const data = fs.readFileSync(this.configFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If the file doesn't exist or is invalid JSON, return a default configuration
      console.error('Error loading config file:', error.message);
      return this.getDefaultConfig();
    }
  }

  saveConfig(config: Config): void {
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(this.configFilePath, data, 'utf-8');
    console.log('Config file saved successfully.');
  }

  private getDefaultConfig(): Config {
    return {
      gameCreation: true,
      maxRaise: 50,
      minRaise: 200,
      maxStart: 200,
      minStart: 50,
      maxJoin: 1000,
      minJoin: 300,
      maxPlayers: 8
    };
  }
}