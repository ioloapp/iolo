import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {persistReducer, persistStore} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import {userReducer} from './user/userSlice';
import {secretsReducer} from "./secrets/secretsSlice";
import {policiesReducer} from "./policies/policiesSlice";
import {contactsReducer} from "./contacts/contactsSlice";
import {REHYDRATE} from "redux-persist/es/constants";

const persistConfig = {
    key: 'iolo',
    storage,
};

const appReducer = combineReducers({
    user: userReducer,
    secrets: secretsReducer,
    policies: policiesReducer,
    contacts: contactsReducer,
});

const rootReducer = (state, action) => {
    if (action.type === "user/logOut") {
        storage.removeItem('persist:root')
        return appReducer(undefined, action)
    }
    if(action.type === REHYDRATE) {
        const incomingState = action.payload;
        if (incomingState?.user?.loginStatus === 'pending') {
            return {
                ...incomingState,
                user: {
                    ...incomingState.user,
                    loginStatus: "init"
                }
            }
        }
        return incomingState;
    }
    return appReducer(state, action)
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: true,
            serializableCheck: false
        }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
