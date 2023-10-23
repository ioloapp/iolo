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
import AddIcon from "@mui/icons-material/Add";
import {
    Checkbox,
    Divider,
    Fab,
    FormControl,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Select,
    SelectChangeEvent,
    Typography
} from "@mui/material";
import {UiTestament} from "../../services/IcTypesForUi";
import {addTestamentThunk, testamentsActions, updateTestamentThunk} from "../../redux/testaments/testamentsSlice";
import {
    selectShowAddTestamentDialog,
    selectShowEditTestamentDialog,
    selectTestamentToAdd
} from "../../redux/testaments/testamentsSelectors";
import {selectHeirs} from "../../redux/heirs/heirsSelectors";
import {selectCurrentUser} from "../../redux/user/userSelectors";

export default function AddEditTestamentDialog() {
    const dispatch = useAppDispatch();
    const showAddTestamentDialog = useSelector(selectShowAddTestamentDialog);
    const showEditTestamentDialog = useSelector(selectShowEditTestamentDialog);
    const testamentToAdd = useSelector(selectTestamentToAdd);
    const groupedSecretList = useSelector(selectGroupedSecrets);
    const heirsList = useSelector(selectHeirs);
    const secretsList = useSelector(selectSecrets);
    const currentUser = useSelector(selectCurrentUser);
    const [selectedSecrets, setSelectedSecrets] = React.useState<string[]>(testamentToAdd.secrets ? testamentToAdd.secrets : []);
    const [selectedHeirs, setSelectedHeirs] = React.useState<string[]>(testamentToAdd.heirs ? testamentToAdd.heirs.map(heir => heir.id) : []);

    const handleClickOpen = () => {
        dispatch(testamentsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(testamentsActions.closeAddDialog());
    };

    const updateTestamentToAdd = (testament: UiTestament) => {
        dispatch(testamentsActions.updateTestamentToAdd(testament))
    }

    const cancelAddTestament = () => {
        setSelectedHeirs([]);
        setSelectedSecrets([]);
        dispatch(testamentsActions.cancelAddOrEditTestament());
    }

    const createTestament = async () => {
        dispatch(addTestamentThunk({
            ...testamentToAdd,
            testator: currentUser
        }));
    }

    const updateTestament = async () => {
        dispatch(updateTestamentThunk({
            ...testamentToAdd,
            testator: currentUser,
        }));
    }

    const handleSecretChange = (event: SelectChangeEvent<typeof selectedSecrets>) => {
        const {target: {value}} = event;
        let ids = typeof value === 'string' ? value.split(',') : value;
        ids = ids.flatMap(f => f ? [f] : []);
        setSelectedSecrets(ids);
        dispatch(testamentsActions.updateTestamentToAdd({
            ...testamentToAdd,
            secrets: ids

        }))
    };

    const handleHeirChange = (event: SelectChangeEvent<typeof selectedHeirs>) => {
        const {target: {value}} = event;
        let ids = typeof value === 'string' ? value.split(',') : value;
        ids = ids.flatMap(f => f ? [f] : [])
        setSelectedHeirs(ids);
        dispatch(testamentsActions.updateTestamentToAdd({
            ...testamentToAdd,
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
        <div>
            <Fab color="primary" aria-label="add" onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <Dialog open={showAddTestamentDialog || showEditTestamentDialog} onClose={handleClose}>
                <DialogTitle>{showAddTestamentDialog? `Add Testament` : `Edit Testament`}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To add/edit a testament choose the secrets, heirs and fill in the necessary information.
                    </DialogContentText>
                    <FormControl fullWidth>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label="Name"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            variant="standard"
                            value={testamentToAdd.name}
                            onChange={e => updateTestamentToAdd({
                                ...testamentToAdd,
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelAddTestament}>Cancel</Button>
                    {showAddTestamentDialog && <Button onClick={createTestament}>Add Testament</Button>}
                    {showEditTestamentDialog && <Button onClick={updateTestament}>Update Testament</Button>}
                </DialogActions>
            </Dialog>
        </div>
    );
}
