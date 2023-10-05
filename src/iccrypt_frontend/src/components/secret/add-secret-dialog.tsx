import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector} from "react-redux";
import {selectSecretToAdd, selectShowAddSecretDialog} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {addSecretThunk, secretsActions} from "../../redux/secrets/secretsSlice";
import AddIcon from "@mui/icons-material/Add";
import {Fab, FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import {UiSecret, UiSecretCategory} from "../../services/IcTypesForUi";

export default function AddSecretDialog() {
    const dispatch = useAppDispatch();
    const showAddSecretDialog = useSelector(selectShowAddSecretDialog);
    const secretToAdd = useSelector(selectSecretToAdd);

    const handleClickOpen = () => {
        dispatch(secretsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(secretsActions.closeAddDialog());
    };

    const updateSecret = (secret: UiSecret) => {
        dispatch(secretsActions.updateSecretToAdd(secret))
    }

    const cancelAddSecret = () => {
        dispatch(secretsActions.cancelAddSecret())
    }

    const createSecret = async () => {
        dispatch(addSecretThunk(secretToAdd));
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
            <Dialog open={showAddSecretDialog} onClose={handleClose}>
                <DialogTitle>Add Secret</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To add a new Secret choose the category of it and fill in the necessary information.
                    </DialogContentText>
                    <FormControl fullWidth>
                        <InputLabel id="category-select-label">Category</InputLabel>
                        <Select
                            labelId="category-select-label"
                            id="category-select"
                            value={secretToAdd.category}
                            label="Category"
                            onChange={e => updateSecret({
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
                            fullWidth
                            variant="standard"
                            value={secretToAdd.name}
                            onChange={e => updateSecret({
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
                                    fullWidth
                                    variant="standard"
                                    value={secretToAdd.username}
                                    onChange={e => updateSecret({
                                        ...secretToAdd,
                                        username: e.target.value
                                    })}
                                />
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    id="password"
                                    label="Password"
                                    fullWidth
                                    type="password"
                                    variant="standard"
                                    value={secretToAdd.password}
                                    onChange={e => updateSecret({
                                        ...secretToAdd,
                                        password: e.target.value
                                    })}
                                />
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    id="url"
                                    label="URL"
                                    fullWidth
                                    variant="standard"
                                    value={secretToAdd.url}
                                    onChange={e => updateSecret({
                                        ...secretToAdd,
                                        url: e.target.value
                                    })}
                                />
                            </>
                        }
                        {secretToAdd.category === UiSecretCategory.Note &&
                            <TextField
                                autoFocus
                                margin="dense"
                                id="notes"
                                label="Notes"
                                fullWidth
                                variant="standard"
                                value={secretToAdd.notes}
                                multiline
                                onChange={e => updateSecret({
                                    ...secretToAdd,
                                    notes: e.target.value
                                })}
                            />
                        }
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelAddSecret}>Cancel</Button>
                    <Button onClick={createSecret}>Add Secret</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
