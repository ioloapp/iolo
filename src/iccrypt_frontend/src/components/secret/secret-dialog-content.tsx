import * as React from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {selectDialogItem} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {secretsActions} from "../../redux/secrets/secretsSlice";
import {FormControl, MenuItem, Select, Typography} from "@mui/material";
import {UiSecret, UiSecretCategory} from "../../services/IcTypesForUi";

export default function SecretDialogContent() {
    const dispatch = useAppDispatch();
    const dialogItem = useSelector(selectDialogItem);

    const updateSecretToAdd = (secret: UiSecret) => {
        dispatch(secretsActions.updateDialogItem(secret))
    }

    return (
        <>
            <FormControl fullWidth>
                <Typography variant="body2">Category</Typography>
                <Select
                    id="category-select"
                    value={dialogItem.category}
                    label="Category"
                    onChange={e => updateSecretToAdd({
                        ...dialogItem,
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
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.name}
                    onChange={e => updateSecretToAdd({
                        ...dialogItem,
                        name: e.target.value
                    })}
                />
                {dialogItem.category === UiSecretCategory.Password &&
                    <>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="username"
                            label="Username"
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={dialogItem.username}
                            onChange={e => updateSecretToAdd({
                                ...dialogItem,
                                username: e.target.value
                            })}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            id="password"
                            label="Password"
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            type="password"
                            variant="standard"
                            value={dialogItem.password}
                            onChange={e => updateSecretToAdd({
                                ...dialogItem,
                                password: e.target.value
                            })}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            id="url"
                            label="URL"
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={dialogItem.url}
                            onChange={e => updateSecretToAdd({
                                ...dialogItem,
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
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.notes}
                    multiline
                    onChange={e => updateSecretToAdd({
                        ...dialogItem,
                        notes: e.target.value
                    })}
                />
            </FormControl>
        </>
    );
}
