enum LogType {
    INFO = "[INFO]",
    WARN = "[WARNING]",
    ERROR = "[ERROR]"
}

export class LogManager {
    private static instance: LogManager | null = null;
    private logs: string[];

    private constructor() {
        this.logs = [];
    }

    public static getInstance(): LogManager {
        if (!LogManager.instance) {
            LogManager.instance = new LogManager();
        }
        return LogManager.instance;
    }

    log(message: string, type?: number): void {
        const date: Date = new Date();
        const time: string = `**[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]**`;

        if (!type) {
            type = 1;
        }

        let logType: LogType;
        switch (type) {
            case 1:
                logType = LogType.INFO;
                break;
            case 2:
                logType = LogType.WARN;
                break;
            case 3:
                logType = LogType.ERROR;
                break;
            default:
                logType = LogType.INFO;
                break;
        }

        const logEntry = `${time} - **${logType}** ${message}`;
        console.log(logEntry);
        this.logs.push(logEntry);
    }

    getLogs(): string {
        return this.logs.join("\n").slice(Math.max(this.logs.length - 100, 0));
    }
}
