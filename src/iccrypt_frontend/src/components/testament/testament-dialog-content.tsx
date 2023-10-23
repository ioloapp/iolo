import * as React from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {selectGroupedSecrets} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {
    Checkbox,
    Divider,
    FormControl,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Select,
    SelectChangeEvent,
    Typography
} from "@mui/material";
import {UiTestament} from "../../services/IcTypesForUi";
import {testamentsActions} from "../../redux/testaments/testamentsSlice";
import {selectTestamentDialogItem} from "../../redux/testaments/testamentsSelectors";
import {selectHeirs} from "../../redux/heirs/heirsSelectors";

export default function TestamentDialogContent() {
    const dispatch = useAppDispatch();
    const dialogItem = useSelector(selectTestamentDialogItem);
    const groupedSecretList = useSelector(selectGroupedSecrets);
    const heirsList = useSelector(selectHeirs);
    const [selectedSecrets, setSelectedSecrets] = React.useState<string[]>(dialogItem.secrets ? dialogItem.secrets : []);
    const [selectedHeirs, setSelectedHeirs] = React.useState<string[]>(dialogItem.heirs ? dialogItem.heirs.map(heir => heir.id) : []);

    const updateTestamentToAdd = (testament: UiTestament) => {
        dispatch(testamentsActions.updateDialogItem(testament))
    }

    const handleSecretChange = (event: SelectChangeEvent<typeof selectedSecrets>) => {
        const {target: {value}} = event;
        let ids = typeof value === 'string' ? value.split(',') : value;
        ids = ids.flatMap(f => f ? [f] : []);
        setSelectedSecrets(ids);
        dispatch(testamentsActions.updateDialogItem({
            ...dialogItem,
            secrets: ids

        }))
    };

    const handleHeirChange = (event: SelectChangeEvent<typeof selectedHeirs>) => {
        const {target: {value}} = event;
        let ids = typeof value === 'string' ? value.split(',') : value;
        ids = ids.flatMap(f => f ? [f] : [])
        setSelectedHeirs(ids);
        dispatch(testamentsActions.updateDialogItem({
            ...dialogItem,
            heirs: [...ids.map(id => heirsList.find(h => h.id === id))]
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
                    label="Name"
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.name}
                    onChange={e => updateTestamentToAdd({
                        ...dialogItem,
                        name: e.target.value
                    })}
                />
            </FormControl>
            <FormControl fullWidth>
                <Typography variant="body2">Secrets</Typography>
                <Select
                    labelId="secrets-multiple-checkbox-label"
                    id="secrets-multiple-checkbox"
                    multiple
                    value={selectedSecrets}
                    onChange={handleSecretChange}
                    input={<OutlinedInput label="Secrets"/>}
                    renderValue={(selected) => selected.join(', ')}
                    MenuProps={MenuProps}
                >
                    {groupedSecretList.passwordList?.length > 0 &&
                        <Divider textAlign="left">Passwords</Divider>}
                    {groupedSecretList.passwordList.map((secret) => (
                        <MenuItem key={secret.id} value={secret.id}>
                            <Checkbox checked={selectedSecrets.indexOf(secret.id) > -1}/>
                            <ListItemText primary={secret.name}/>
                        </MenuItem>
                    ))}

                    {groupedSecretList.notesList?.length > 0 && <Divider textAlign="left">Notes</Divider>}
                    {groupedSecretList.notesList.map((secret) => (
                        <MenuItem key={secret.id} value={secret.id}>
                            <Checkbox checked={selectedSecrets.indexOf(secret.id) > -1}/>
                            <ListItemText primary={secret.name}/>
                        </MenuItem>
                    ))}

                    {groupedSecretList.documentsList?.length > 0 &&
                        <Divider textAlign="left">Documents</Divider>}
                    {groupedSecretList.documentsList.map((secret) => (
                        <MenuItem key={secret.id} value={secret.id}>
                            <Checkbox checked={selectedSecrets.indexOf(secret.id) > -1}/>
                            <ListItemText primary={secret.name}/>
                        </MenuItem>
                    ))}

                    {groupedSecretList.othersList?.length > 0 && <Divider textAlign="left">Others</Divider>}
                    {groupedSecretList.othersList.map((secret) => (
                        <MenuItem key={secret.id} value={secret.id}>
                            <Checkbox checked={selectedSecrets.indexOf(secret.id) > -1}/>
                            <ListItemText primary={secret.name}/>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth>
                <Typography variant="body2">Heirs</Typography>
                <Select
                    id="heirs-multiple-checkbox"
                    multiple
                    value={selectedHeirs}
                    onChange={handleHeirChange}
                    input={<OutlinedInput label="Heirs"/>}
                    renderValue={(selected) => selected.join(', ')}
                    MenuProps={MenuProps}
                >
                    {heirsList.map((heir) => (
                        <MenuItem key={heir.id} value={heir.id}>
                            <Checkbox checked={selectedHeirs.indexOf(heir.id) > -1}/>
                            <ListItemText primary={heir.name}/>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </>
    );
}
