export type Color = 'white' | 'black'

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p'

export type Piece = {
  type: PieceType
  color: Color
}

export type Square = Piece | null

export type Board = Square[][]

export type SquareCoordinate = {
  row: number
  col: number
}

export type GameStatus =
  'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'

export type MoveType = 'normal' | 'castle' | 'promotion' | 'en-passant'

export type Move = {
  from: SquareCoordinate
  to: SquareCoordinate
  piece: Piece
  capturedPiece: Piece | null
  type: MoveType
  promotionPiece?: PieceType
}

export type GameState = {
  board: Board
  turn: Color
  status: GameStatus
  moveHistory: Move[]
  castlingRights: CastlingRights
}

export type CastlingRights = {
  whiteKingSide: boolean
  whiteQueenSide: boolean
  blackKingSide: boolean
  blackQueenSide: boolean
}
