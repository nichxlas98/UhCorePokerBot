// game states enums
enum GameState {
    WAITING = "WAITING...",
    STARTING = "STARTING...",
    RUNNING = "RUNNING"
}

enum GamePhase {
    BLIND = "Blind",
    PRE_FLOP = "Pre-Flop",
    FLOP = "Flop",
    TURN = "Turn",
    RIVER = "River",
    END = "End"
}

enum PlayerState {
    WAITING,
    PLAYING,
    FOLDED,
    BUSTED,
    QUIT
}

enum PlayerAction {
    START,
    FOLD,
    CHECK,
    CALL,
    RAISE,
    ALL_IN
}

export { GameState, GamePhase, PlayerState, PlayerAction };