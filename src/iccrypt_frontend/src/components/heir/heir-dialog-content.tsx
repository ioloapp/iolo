import * as React from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {FormControl, MenuItem, Select, Typography} from "@mui/material";
import {UiUser, UiUserType} from "../../services/IcTypesForUi";
import {selectHeirToAdd} from "../../redux/heirs/heirsSelectors";
import {heirsActions} from "../../redux/heirs/heirsSlice";

export default function HeirDialogContent() {
    const dispatch = useAppDispatch();
    const heirToAdd = useSelector(selectHeirToAdd);

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
                    InputLabelProps={{shrink: true}}
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
                    InputLabelProps={{shrink: true}}
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
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={heirToAdd.email}
                    onChange={e => updateHeirToAdd({
                        ...heirToAdd,
                        email: e.target.value
                    })}
                />
            </FormControl>
        </>
    );
}
