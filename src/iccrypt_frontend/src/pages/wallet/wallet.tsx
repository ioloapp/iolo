import {Button, Typography} from "@mui/material";
import * as React from "react";
import IcCryptService from "../../services/IcCryptService";
import {useAppDispatch} from "../../redux/hooks";
import {secretsActions} from "../../redux/secrets/secretsSlice";
import {v4 as uuidv4} from 'uuid';

export function Wallet() {

    const icCryptService = new IcCryptService();
    const dispatch = useAppDispatch();


    const createSecret = async () => {
        const secretList = await icCryptService.addSecret({
            id: uuidv4(),
            category: undefined,
            date_created: 0n,
            date_modified: 0n,
            name: ['test'],
            notes: undefined,
            password: undefined,
            url: undefined,
            username: undefined

        });
        dispatch(secretsActions.setSecretList(secretList));
    }

    return (<>
        <Typography variant="h4">Wallet</Typography>
        <Button variant="contained" onClick={createSecret}>Create Secret</Button>
    </>);
}
