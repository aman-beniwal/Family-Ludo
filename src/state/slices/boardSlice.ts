import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type TBoardState = {
  boardSideLength: number;
  boardTileSize: number;
  tokenHeight: number;
  tokenWidth: number;
};

export const initialState: TBoardState = {
  boardSideLength: 0,
  boardTileSize: 0,
  tokenHeight: 0,
  tokenWidth: 0,
};

export const NUMBER_OF_BLOCKS_IN_ONE_ROW = 15;
// Square tokens for the jelly-pawn art (the old teardrop pawn used 0.625).
export const TOKEN_WIDTH_HEIGHT_RATIO = 1;

const reducers = {
  resizeBoard: (state: TBoardState, action: PayloadAction<number>) => {
    state.boardSideLength = action.payload;
    state.boardTileSize = action.payload / NUMBER_OF_BLOCKS_IN_ONE_ROW;
    // Pawns are 0.88 of a tile (was 0.8 — bumped 10% for a bolder look).
    state.tokenHeight = (action.payload / NUMBER_OF_BLOCKS_IN_ONE_ROW) * 0.88;
    state.tokenWidth =
      (action.payload / NUMBER_OF_BLOCKS_IN_ONE_ROW) * 0.88 * TOKEN_WIDTH_HEIGHT_RATIO;
  },
  clearBoardState: () => initialState,
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers,
});

export const { resizeBoard, clearBoardState } = boardSlice.actions;

export default boardSlice.reducer;
