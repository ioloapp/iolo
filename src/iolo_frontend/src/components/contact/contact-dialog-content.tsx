import * as React from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {FormControl, MenuItem, Select, Typography} from "@mui/material";
import {UiUser, UiUserType} from "../../services/IoloTypesForUi";
import {selectContactsDialogItem} from "../../redux/contacts/contactsSelectors";
import {contactsActions} from "../../redux/contacts/contactsSlice";

export default function ContactDialogContent() {
    const dispatch = useAppDispatch();
    const dialogItem = useSelector(selectContactsDialogItem);

    const updateContactToAdd = (heir: UiUser) => {
        dispatch(contactsActions.updateContactToAdd(heir))
    }

    return (
        <>
            <FormControl fullWidth>
                <Typography variant="body2">Category</Typography>
                <Select
                    labelId="category-select-label"
                    id="type"
                    value={dialogItem.type}
                    label="Category"
                    onChange={e => updateContactToAdd({
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
                    onChange={e => updateContactToAdd({
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
                    onChange={e => updateContactToAdd({
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
                    onChange={e => updateContactToAdd({
                        ...dialogItem,
                        email: e.target.value
                    })}
                />
            </FormControl>
        </>
    );
}
