import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector} from "react-redux";
import {
    selectDialogItemState,
    selectSecretToAdd,
    selectShowAddSecretDialog,
    selectShowEditSecretDialog
} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {addSecretThunk, secretsActions, updateSecretThunk} from "../../redux/secrets/secretsSlice";
import AddIcon from "@mui/icons-material/Add";
import {CircularProgress, Fab, FormControl, MenuItem, Select, Typography} from "@mui/material";
import {UiSecret, UiSecretCategory} from "../../services/IcTypesForUi";

export default function AddEditSecretDialog() {
    const dispatch = useAppDispatch();
    const showAddSecretDialog: boolean = useSelector(selectShowAddSecretDialog);
    const showEditSecretDialog: boolean = useSelector(selectShowEditSecretDialog);
    const dialogItemState: string = useSelector(selectDialogItemState);
    const secretToAdd = useSelector(selectSecretToAdd);

    const handleClickOpen = () => {
        dispatch(secretsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(secretsActions.closeAddOrEditDialog());
    };

    const updateSecretToAdd = (secret: UiSecret) => {
        dispatch(secretsActions.updateSecretToAdd(secret))
    }

    const cancelAddSecret = () => {
        dispatch(secretsActions.cancelAddSecret())
    }

    const createSecret = async () => {
        dispatch(addSecretThunk(secretToAdd));
    }

    const updateSecret = async () => {
        dispatch(updateSecretThunk(secretToAdd));
    }

    if(dialogItemState === 'loading'){
        return (
            <Dialog open={showAddSecretDialog || showEditSecretDialog} onClose={handleClose}>
                <DialogTitle>Edit Secret</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Decrypting your secret...
                    </DialogContentText>
                    <CircularProgress />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <div>
            <Fab color="primary" aria-label="add" onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <Dialog open={showAddSecretDialog || showEditSecretDialog} onClose={handleClose}>
                <DialogTitle>Add Secret</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To add a new Secret choose the category of it and fill in the necessary information.
                    </DialogContentText>
                    <FormControl fullWidth>
                        <Typography variant="body2">Category</Typography>
                        <Select
                            id="category-select"
                            value={secretToAdd.category}
                            label="Category"
                            onChange={e => updateSecretToAdd({
                                ...secretToAdd,
                                category: UiSecretCategory[e.target.value as keyof typeof UiSecretCategory]
                            })}
                        >
                            {Object.keys(UiSecretCategory)
                                .map(key => {
                                    return <MenuItem key={key} value={key}>{key}</MenuItem>
                                })

                            }
                        </Select>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label="Name"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            variant="standard"
                            value={secretToAdd.name}
                            onChange={e => updateSecretToAdd({
                                ...secretToAdd,
                                name: e.target.value
                            })}
                        />
                        {secretToAdd.category === UiSecretCategory.Password &&
                            <>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    id="username"
                                    label="Username"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    variant="standard"
                                    value={secretToAdd.username}
                                    onChange={e => updateSecretToAdd({
                                        ...secretToAdd,
                                        username: e.target.value
                                    })}
                                />
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    id="password"
                                    label="Password"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    type="password"
                                    variant="standard"
                                    value={secretToAdd.password}
                                    onChange={e => updateSecretToAdd({
                                        ...secretToAdd,
                                        password: e.target.value
                                    })}
                                />
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    id="url"
                                    label="URL"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    variant="standard"
                                    value={secretToAdd.url}
                                    onChange={e => updateSecretToAdd({
                                        ...secretToAdd,
                                        url: e.target.value
                                    })}
                                />
                            </>
                        }
                        <TextField
                            autoFocus
                            margin="dense"
                            id="notes"
                            label="Notes"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            variant="standard"
                            value={secretToAdd.notes}
                            multiline
                            onChange={e => updateSecretToAdd({
                                ...secretToAdd,
                                notes: e.target.value
                            })}
                        />
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelAddSecret}>Cancel</Button>
                    {showAddSecretDialog && <Button onClick={createSecret}>Add Secret</Button>}
                    {showEditSecretDialog && <Button onClick={updateSecret}>Update Secret</Button>}
                </DialogActions>
            </Dialog>
        </div>
    );
}
