import {useAppSelector} from "../hooks";

export const selectSecrets = () => useAppSelector(({secrets}) => secrets.secretList);

