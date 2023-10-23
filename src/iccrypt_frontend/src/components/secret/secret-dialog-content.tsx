import * as React from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {selectSecretToAdd} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {secretsActions} from "../../redux/secrets/secretsSlice";
import {FormControl, MenuItem, Select, Typography} from "@mui/material";
import {UiSecret, UiSecretCategory} from "../../services/IcTypesForUi";

export default function SecretDialogContent() {
    const dispatch = useAppDispatch();
    const secretToAdd = useSelector(selectSecretToAdd);

    const updateSecretToAdd = (secret: UiSecret) => {
        dispatch(secretsActions.updateSecretToAdd(secret))
    }

    return (
        <>
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
                    InputLabelProps={{shrink: true}}
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
                            InputLabelProps={{shrink: true}}
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
                            InputLabelProps={{shrink: true}}
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
                            InputLabelProps={{shrink: true}}
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
                    InputLabelProps={{shrink: true}}
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
        </>
    );
}
