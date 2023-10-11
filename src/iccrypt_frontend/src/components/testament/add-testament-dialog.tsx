import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector} from "react-redux";
import {selectGroupedSecrets, selectSecrets} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {addSecretThunk} from "../../redux/secrets/secretsSlice";
import AddIcon from "@mui/icons-material/Add";
import {
    Checkbox,
    Divider,
    Fab,
    FormControl,
    InputLabel,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Select,
    SelectChangeEvent
} from "@mui/material";
import {UiTestament} from "../../services/IcTypesForUi";
import {testamentsActions} from "../../redux/testaments/testamentsSlice";
import {selectShowAddTestamentDialog, selectTestamentToAdd} from "../../redux/testaments/testamentsSelectors";
import {selectHeirs} from "../../redux/heirs/heirsSelectors";

export default function AddTestamentDialog() {
    const dispatch = useAppDispatch();
    const showAddSecretDialog = useSelector(selectShowAddTestamentDialog);
    const testamentToAdd = useSelector(selectTestamentToAdd);
    const groupedSecretList = useSelector(selectGroupedSecrets);
    const heirsList = useSelector(selectHeirs);
    const secretsList = useSelector(selectSecrets);
    const [selectedSecrets, setSelectedSecrets] = React.useState<string[]>(testamentToAdd.secrets ? testamentToAdd.secrets.map(secret => secret.id) : []);
    const [selectedHeirs, setSelectedHeirs] = React.useState<string[]>(testamentToAdd.heirs ? testamentToAdd.heirs.map(heir => heir.id) : []);

    const handleClickOpen = () => {
        dispatch(testamentsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(testamentsActions.closeAddDialog());
    };

    const updateTestament = (testament: UiTestament) => {
        dispatch(testamentsActions.updateTestamentToAdd(testament))
    }

    const cancelAddSecret = () => {
        dispatch(testamentsActions.cancelAddTestament())
    }

    const createSecret = async () => {
        dispatch(addSecretThunk(testamentToAdd));
    }

    const handleSecretChange = (event: SelectChangeEvent<typeof selectedHeirs>) => {
        const {target: {value}} = event;
        const ids = typeof value === 'string' ? value.split(',') : value;
        setSelectedHeirs(ids);
        dispatch(testamentsActions.updateTestamentToAdd({
            ...testamentToAdd,
            secrets: [...testamentToAdd.secrets ? testamentToAdd.secrets : [], ids.map(id => secretsList.find(s => s.id === id))]
        }))
    };

    const handleHeirChange = (event: SelectChangeEvent<typeof selectedHeirs>) => {
        const {target: {value}} = event;
        const ids = typeof value === 'string' ? value.split(',') : value;
        setSelectedHeirs(ids);
        dispatch(testamentsActions.updateTestamentToAdd({
            ...testamentToAdd,
            heirs: [...testamentToAdd.heirs ? testamentToAdd.heirs : [], ids.map(id => heirsList.find(h => h.id === id))]
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
        <div>
            <Fab color="primary" aria-label="add" onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <Dialog open={showAddSecretDialog} onClose={handleClose}>
                <DialogTitle>Add Secret</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To add a new testament choose the secrets, heirs and fill in the necessary information.
                    </DialogContentText>
                    <FormControl fullWidth>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label="Name"
                            fullWidth
                            variant="standard"
                            value={testamentToAdd.name}
                            onChange={e => updateTestament({
                                ...testamentToAdd,
                                name: e.target.value
                            })}
                        />
                        <InputLabel id="secrets-multiple-checkbox-label">Secrets</InputLabel>
                        <Select
                            labelId="secrets-multiple-checkbox-label"
                            id="secrets-multiple-checkbox"
                            multiple
                            value={selectedHeirs}
                            onChange={handleSecretChange}
                            input={<OutlinedInput label="Secrets"/>}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                        >
                            {groupedSecretList.passwordList?.length > 0 && <Divider textAlign="left">Passwords</Divider>}
                            {groupedSecretList.passwordList.map((secret) => (
                                <MenuItem key={secret.id} value={secret.id}>
                                    <Checkbox checked={selectedHeirs.indexOf(secret.id) > -1}/>
                                    <ListItemText primary={secret.name}/>
                                </MenuItem>
                            ))}

                            {groupedSecretList.notesList?.length > 0 && <Divider textAlign="left">Notes</Divider>}
                            {groupedSecretList.notesList.map((secret) => (
                                <MenuItem key={secret.id} value={secret.id}>
                                    <Checkbox checked={selectedHeirs.indexOf(secret.id) > -1}/>
                                    <ListItemText primary={secret.name}/>
                                </MenuItem>
                            ))}

                            {groupedSecretList.documentsList?.length > 0 && <Divider textAlign="left">Documents</Divider>}
                            {groupedSecretList.documentsList.map((secret) => (
                                <MenuItem key={secret.id} value={secret.id}>
                                    <Checkbox checked={selectedHeirs.indexOf(secret.id) > -1}/>
                                    <ListItemText primary={secret.name}/>
                                </MenuItem>
                            ))}

                            {groupedSecretList.othersList?.length > 0 && <Divider textAlign="left">Others</Divider>}
                            {groupedSecretList.othersList.map((secret) => (
                                <MenuItem key={secret.id} value={secret.id}>
                                    <Checkbox checked={selectedHeirs.indexOf(secret.id) > -1}/>
                                    <ListItemText primary={secret.name}/>
                                </MenuItem>
                            ))}
                        </Select>
                        <InputLabel id="heirs-multiple-checkbox-label">Heirs</InputLabel>
                        <Select
                            labelId="heirs-multiple-checkbox-label"
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelAddSecret}>Cancel</Button>
                    <Button onClick={createSecret}>Add Testament</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
