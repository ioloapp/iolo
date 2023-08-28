import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a type for the slice state
interface UserState {
    isLoggedIn: boolean,
    principal: String | null,
    hasAccount: boolean,
}

// Define the initial state using that type
const initialState: UserState = {
    isLoggedIn: false,
    principal: null,
    hasAccount: false,
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logIn: (state, action) => {
            // Redux Toolkit allows us to write "mutating" logic in reducers. It
            // doesn't actually mutate the state because it uses the Immer library,
            // which detects changes to a "draft state" and produces a brand new
            // immutable state based off those changes
            state.isLoggedIn = true;
            state.principal = action.payload;
        },
        logOut: (state) => {
            state.isLoggedIn = false;
            state.principal = null;
        },
        hasAccount: (state, action: PayloadAction<boolean>) => {
            state.hasAccount = action.payload;
        }
    },
})

// Action creators are generated for each case reducer function
export const { logIn, logOut, hasAccount } = userSlice.actions;

export default userSlice.reducer;
