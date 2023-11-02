import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {persistReducer, persistStore} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import {userReducer} from './user/userSlice';
import {secretsReducer} from "./secrets/secretsSlice";
import {testamentsReducer} from "./testaments/testamentsSlice";
import {heirsReducer} from "./heirs/heirsSlice";

const persistConfig = {
    key: 'root',
    storage,
};

const appReducer = combineReducers({
    user: userReducer,
    secrets: secretsReducer,
    testaments: testamentsReducer,
    heirs: heirsReducer
});

const rootReducer = (state, action) => {
    if (action.type === "user/logOut") {
        storage.removeItem('persist:root')
        return appReducer(undefined, action)
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
