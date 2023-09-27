import {RootState} from "../store";

export const selectSecrets = (state: RootState)  => state.secrets.secretList;

