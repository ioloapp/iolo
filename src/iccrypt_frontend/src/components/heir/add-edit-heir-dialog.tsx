import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import AddIcon from "@mui/icons-material/Add";
import {Fab, FormControl, MenuItem, Select, Typography} from "@mui/material";
import {UiUser, UiUserType} from "../../services/IcTypesForUi";
import {selectHeirToAdd, selectShowAddHeirDialog, selectShowEditHeirDialog} from "../../redux/heirs/heirsSelectors";
import {addHeirThunk, heirsActions, updateHeirThunk} from "../../redux/heirs/heirsSlice";

export default function AddEditHeirDialog() {
    const dispatch = useAppDispatch();
    const showAddHeirDialog = useSelector(selectShowAddHeirDialog);
    const showEditHeirDialog = useSelector(selectShowEditHeirDialog);
    const heirToAdd = useSelector(selectHeirToAdd);

    const handleClickOpen = () => {
        dispatch(heirsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(heirsActions.closeAddDialog());
    };

    const updateHeirToAdd = (heir: UiUser) => {
        dispatch(heirsActions.updateHeirToAdd(heir))
    }

    const cancelAddHeir = () => {
        dispatch(heirsActions.cancelAddHeir())
    }

    const createHeir = async () => {
        dispatch(addHeirThunk(heirToAdd));
    }

    const updateHeir = async () => {
        dispatch(updateHeirThunk(heirToAdd));
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
            <Dialog open={showAddHeirDialog || showEditHeirDialog} onClose={handleClose}>
                <DialogTitle>Add Heir</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To add a new Heir enter the id of it and extend it with a known name.
                    </DialogContentText>
                    <FormControl fullWidth>
                        <Typography variant="body2">Category</Typography>
                        <Select
                            labelId="category-select-label"
                            id="category-select"
                            value={heirToAdd.type}
                            label="Category"
                            onChange={e => updateHeirToAdd({
                                ...heirToAdd,
                                type: UiUserType[e.target.value as keyof typeof UiUserType]
                            })}
                        >
                            {Object.keys(UiUserType)
                                .map(key => {
                                    return <MenuItem key={key} value={key}>{key}</MenuItem>
                                })

                            }
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="id"
                            label="Internet Computer ID"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            variant="standard"
                            value={heirToAdd.id}
                            onChange={e => updateHeirToAdd({
                                ...heirToAdd,
                                id: e.target.value
                            })}
                        />
                    </FormControl>
                    <FormControl fullWidth>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label="Name"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            variant="standard"
                            value={heirToAdd.name}
                            onChange={e => updateHeirToAdd({
                                ...heirToAdd,
                                name: e.target.value
                            })}
                        />
                    </FormControl>
                    <FormControl fullWidth>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="email"
                            label="E-Mail"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            variant="standard"
                            value={heirToAdd.email}
                            onChange={e => updateHeirToAdd({
                                ...heirToAdd,
                                email: e.target.value
                            })}
                        />
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelAddHeir}>Cancel</Button>
                    {showAddHeirDialog && <Button onClick={createHeir}>Add Heir</Button>}
                    {showEditHeirDialog && <Button onClick={updateHeir}>Update Heir</Button>}
                </DialogActions>
            </Dialog>
        </div>
    );
}
