import * as React from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {FormControl, MenuItem, Select, Typography} from "@mui/material";
import {UiUser, UiUserType} from "../../services/IcTypesForUi";
import {selectHeirDialogItem} from "../../redux/heirs/heirsSelectors";
import {heirsActions} from "../../redux/heirs/heirsSlice";

export default function HeirDialogContent() {
    const dispatch = useAppDispatch();
    const dialogItem = useSelector(selectHeirDialogItem);

    const updateHeirToAdd = (heir: UiUser) => {
        dispatch(heirsActions.updateHeirToAdd(heir))
    }

    return (
        <>
            <FormControl fullWidth>
                <Typography variant="body2">Category</Typography>
                <Select
                    labelId="category-select-label"
                    id="category-select"
                    value={dialogItem.type}
                    label="Category"
                    onChange={e => updateHeirToAdd({
                        ...dialogItem,
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
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.id}
                    onChange={e => updateHeirToAdd({
                        ...dialogItem,
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
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.name}
                    onChange={e => updateHeirToAdd({
                        ...dialogItem,
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
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.email}
                    onChange={e => updateHeirToAdd({
                        ...dialogItem,
                        email: e.target.value
                    })}
                />
            </FormControl>
        </>
    );
}
