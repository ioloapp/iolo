import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector} from "react-redux";
import {selectSecrets} from "../../redux/secrets/secretsSelectors";
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
import {selectHeires} from "../../redux/heires/heiresSelectors";

export default function AddTestamentDialog() {
    const dispatch = useAppDispatch();
    const showAddSecretDialog = useSelector(selectShowAddTestamentDialog);
    const testamentToAdd = useSelector(selectTestamentToAdd);
    const secretList = useSelector(selectSecrets);
    const heiresList = useSelector(selectHeires);
    const [selectedSecrets, setSelectedSecrets] = React.useState<string[]>(testamentToAdd.secrets ? testamentToAdd.secrets.map(secret => secret.id) : []);
    const [selectedHeires, setSelectedHeires] = React.useState<string[]>(testamentToAdd.heirs ? testamentToAdd.heirs.map(heire => heire.id) : []);

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

    const handleSecretChange = (event: SelectChangeEvent<typeof selectedHeires>) => {
        const {target: {value}} = event;
        const ids = typeof value === 'string' ? value.split(',') : value;
        setSelectedHeires(ids);
        //TODO select object with id
        dispatch(testamentsActions.updateTestamentToAdd({
            ...testamentToAdd,
            secrets: [...testamentToAdd.secrets ? testamentToAdd.secrets : [], ...ids]
        }))
    };

    const handleHeireChange = (event: SelectChangeEvent<typeof selectedHeires>) => {
        const {target: {value}} = event;
        const ids = typeof value === 'string' ? value.split(',') : value;
        setSelectedHeires(ids);
        //TODO select object with id
        dispatch(testamentsActions.updateTestamentToAdd({
            ...testamentToAdd,
            secrets: [...testamentToAdd.secrets ? testamentToAdd.secrets : [], ...ids]
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
                        To add a new testament choose the secrets and fill in the necessary information.
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
                            value={selectedHeires}
                            onChange={handleSecretChange}
                            input={<OutlinedInput label="Secrets"/>}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                        >
                            {secretList.passwordList?.length > 0 && <Divider textAlign="left">Passwords</Divider>}
                            {secretList.passwordList.map((secret) => (
                                <MenuItem key={secret.id} value={secret.id}>
                                    <Checkbox checked={selectedHeires.indexOf(secret.id) > -1}/>
                                    <ListItemText primary={secret.name}/>
                                </MenuItem>
                            ))}

                            {secretList.notesList?.length > 0 && <Divider textAlign="left">Notes</Divider>}
                            {secretList.notesList.map((secret) => (
                                <MenuItem key={secret.id} value={secret.id}>
                                    <Checkbox checked={selectedHeires.indexOf(secret.id) > -1}/>
                                    <ListItemText primary={secret.name}/>
                                </MenuItem>
                            ))}

                            {secretList.documentsList?.length > 0 && <Divider textAlign="left">Documents</Divider>}
                            {secretList.documentsList.map((secret) => (
                                <MenuItem key={secret.id} value={secret.id}>
                                    <Checkbox checked={selectedHeires.indexOf(secret.id) > -1}/>
                                    <ListItemText primary={secret.name}/>
                                </MenuItem>
                            ))}

                            {secretList.othersList?.length > 0 && <Divider textAlign="left">Others</Divider>}
                            {secretList.othersList.map((secret) => (
                                <MenuItem key={secret.id} value={secret.id}>
                                    <Checkbox checked={selectedHeires.indexOf(secret.id) > -1}/>
                                    <ListItemText primary={secret.name}/>
                                </MenuItem>
                            ))}
                        </Select>
                        <InputLabel id="heires-multiple-checkbox-label">Heires</InputLabel>
                        <Select
                            labelId="heires-multiple-checkbox-label"
                            id="heires-multiple-checkbox"
                            multiple
                            value={selectedHeires}
                            onChange={handleHeireChange}
                            input={<OutlinedInput label="Heires"/>}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                        >
                            {heiresList.map((heire) => (
                                <MenuItem key={heire.id} value={heire.id}>
                                    <Checkbox checked={selectedHeires.indexOf(heire.id) > -1}/>
                                    <ListItemText primary={heire.name}/>
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
