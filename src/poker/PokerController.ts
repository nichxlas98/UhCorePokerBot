import { saveGame } from "../data/database";
import List from "../models/List";
import PokerRoom from "./PokerRoom";

class PokerController {
    private static rooms: List<PokerRoom> = new List<PokerRoom>();
    static getInstanceById(gameId: string): PokerRoom | undefined {
        return PokerController.rooms.get(PokerController.rooms.findIndex(t => t.gameId === gameId)) as PokerRoom;
    }

    static getRooms(): List<PokerRoom> {
        return PokerController.rooms;
    }

    static async deleteRoom(table: PokerRoom) {
        saveGame(table);
        PokerController.rooms.remove(PokerController.rooms.find(t => t.gameId === table.gameId));
        await table.channel.delete();
    }

    static createRoom(table: PokerRoom) {
        PokerController.rooms.add(table);
    }
}

export default PokerController;