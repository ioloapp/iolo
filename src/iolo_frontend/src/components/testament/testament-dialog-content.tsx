import * as React from 'react';
import {FC, useEffect} from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {selectGroupedSecrets} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {FormControl, Typography} from "@mui/material";
import {UiSecretListEntry, UiTestamentResponse, UiUser} from "../../services/IoloTypesForUi";
import {testamentsActions} from "../../redux/testaments/testamentsSlice";
import {selectTestamentDialogItem} from "../../redux/testaments/testamentsSelectors";
import {selectHeirs} from "../../redux/heirs/heirsSelectors";
import {SelectList, SelectListItem} from "../selectlist/select-list";
import {useTranslation} from "react-i18next";
import {Conditions} from "../conditions/conditions";


export interface TestamentDialogContentProps {
    viewSecret?: (value: SelectListItem) => any;
    readonly?: boolean;
}

interface SelectedHeir extends SelectListItem, UiUser {
}

interface SelectedSecret extends SelectListItem, UiSecretListEntry {
}

export const TestamentDialogContent: FC<TestamentDialogContentProps> = ({readonly, viewSecret}) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const dialogItem: UiTestamentResponse = useSelector(selectTestamentDialogItem);
    const groupedSecretList = useSelector(selectGroupedSecrets);
    const heirsList = useSelector(selectHeirs);
    const [selectedSecrets, setSelectedSecrets] = React.useState<SelectedSecret[]>([]);
    const [selectedHeirs, setSelectedHeirs] = React.useState<SelectedHeir[]>([]);

    useEffect(() => {
        if (readonly){
            setSelectedSecrets(dialogItem.secrets);
            setSelectedHeirs(dialogItem.heirs);
        } else {
            const selectedHeirs = heirsList.map(h => {
                const heir = dialogItem.heirs.find(dh => dh.id === h.id);
                return heir ? {...h, selected: true} : {...h, selected: false};
            })
            setSelectedHeirs(selectedHeirs)
            const selectedSecrets = [...groupedSecretList.passwordList, ...groupedSecretList.notesList, ...groupedSecretList.documentsList, ...groupedSecretList.othersList].map(s => {
                const secret = dialogItem.secrets.find(ds => ds.id === s.id);
                return secret ? {...s, selected: true} : {...s, selected: false};
            })
            setSelectedSecrets(selectedSecrets)
        }
    }, [dialogItem]);

    const updateTestamentToAdd = (testament: UiTestamentResponse) => {
        dispatch(testamentsActions.updateDialogItem(testament))
    }

    const handleSecretChange = (secret: SelectedSecret) => {
        const oldState = dialogItem.secrets.find(s => s.id === secret.id);
        let secrets: UiSecretListEntry[];
        if (oldState) {
            //not selected
            secrets = dialogItem.secrets.filter(s => s.id !== secret.id);
            setSelectedSecrets(selectedSecrets.map(s => s.id !== secret.id ? s : {...s, selected: false}));
        }else{
            //selected
            secrets = [...dialogItem.secrets, secret]
            setSelectedSecrets(selectedSecrets.map(s => s.id !== secret.id ? s : {...s, selected: true}));
        }
        //Add
        dispatch(testamentsActions.updateDialogItem({
            ...dialogItem,
            secrets
        } as UiTestamentResponse))
    };

    const handleHeirChange = (heir: SelectedHeir) => {
        const oldState = dialogItem.heirs.find(s => s.id === heir.id);
        let heirs: UiUser[];
        if (oldState) {
            //not selected
            heirs = dialogItem.heirs.filter(s => s.id !== heir.id)
            setSelectedHeirs(selectedHeirs.map(s => s.id !== heir.id ? s : {...s, selected: false}));
        }else{
            //selected
            heirs = [...dialogItem.heirs, heir]
            setSelectedHeirs(selectedHeirs.map(s => s.id !== heir.id ? s : {...s, selected: true}));
        }
        //Add
        dispatch(testamentsActions.updateDialogItem({
            ...dialogItem,
            heirs: heirs
        }))
    };

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    };

    return (
        <>
            <FormControl fullWidth>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label={t('policies.dialog.content.name')}
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.name}
                    disabled={readonly}
                    onChange={e => updateTestamentToAdd({
                        ...dialogItem,
                        name: e.target.value
                    })}
                />
            </FormControl>
            <FormControl fullWidth>
                <Typography variant="body2">Secrets</Typography>
                <SelectList handleToggle={handleSecretChange} listItem={selectedSecrets} readonly={readonly} viewItem={viewSecret}/>
            </FormControl>
            <FormControl fullWidth>
                <Typography variant="body2">Heirs</Typography>
                <SelectList handleToggle={handleHeirChange} listItem={selectedHeirs} readonly={readonly}/>
            </FormControl>
            <FormControl fullWidth>
                <Conditions conditions={dialogItem.conditions} readonly={readonly} />
            </FormControl>
        </>
    );
}
