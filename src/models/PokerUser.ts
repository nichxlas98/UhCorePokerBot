import { syncUser } from "../data/database";
import List from "./List";
const users = new List<PokerUser>();

class PokerUser {
    public userId: string;
    public userName: string;
    public masterAccount: string;

    public profileUrl: string;
    public photoId: string;
    public firstName: string;
    public lastName: string;
    public age: number;

    public verified: boolean;
    public balance: number;
    public debt: number;

    public createdAt: number;
    public createdAtFormatted: string;

    static findUserByUserId(userId: string): PokerUser | undefined {
        return users.get(users.findIndex(u => u.userId === userId));
    }

    static findUserByUserName(userName: string): PokerUser | undefined {
        return users.get(users.findIndex(u => u.userName === userName));
    }

    static getUsers(): List<PokerUser> {
        return users;
    }

    constructor(userId: string, userName: string, masterAccount: string, profileUrl: string, 
        photoId: string, firstName: string, lastName: string, age: number, 
        verified: boolean, balance: number, debt: number, createdAt: number) {

        this.userId = userId;
        this.userName = userName;
        this.masterAccount = masterAccount;

        this.profileUrl = profileUrl;
        this.photoId = photoId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;

        this.verified = verified;
        this.balance = balance;
        this.debt = debt;

        const timestamp = Date.now();
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        
        const formatted = new Intl.DateTimeFormat('en-US', options).format(new Date(timestamp));
        formatted.replace(/(\d)(?=(\d{2})+\b)/g, '$1');
        this.createdAt = createdAt;
        this.createdAtFormatted = formatted;

        if (users.get(users.findIndex(u => u.userId === userId))) return;
        users.add(this);
    }

    sync() {
        users.addOrReplaceAtIndex(users.findIndex(u => u.userId === this.userId), this);
        syncUser(this);
    }
}

export default PokerUser;