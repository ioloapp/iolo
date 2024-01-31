import * as React from 'react';
import {FC} from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {selectDialogItem} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {secretsActions} from "../../redux/secrets/secretsSlice";
import {FormControl, MenuItem, Select, Typography} from "@mui/material";
import {UiSecret, UiSecretCategory} from "../../services/IoloTypesForUi";
import {useTranslation} from "react-i18next";

export interface SecretDialogContentProps {
    readonly? : boolean;
}

export const SecretDialogContent : FC<SecretDialogContentProps> = ({readonly}) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const dialogItem = useSelector(selectDialogItem);

    const updateSecretToAdd = (secret: UiSecret) => {
        dispatch(secretsActions.updateDialogItem(secret))
    }

    return (
        <>
            <FormControl fullWidth>
                <div className="input-field">
                    <Typography variant="body2">{t('secrets.dialog.content.category')}</Typography>
                    <Select
                        id="category-select"
                        value={dialogItem.category}
                        disabled={readonly}
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
                </div>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label={t('secrets.dialog.content.name')}
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.name}
                    disabled={readonly}
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
                            label={t('secrets.dialog.content.username')}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={dialogItem.username}
                            disabled={readonly}
                            onChange={e => updateSecretToAdd({
                                ...dialogItem,
                                username: e.target.value
                            })}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            id="password"
                            label={t('secrets.dialog.content.password')}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            type={readonly ? "text" : "password"}
                            variant="standard"
                            value={dialogItem.password}
                            disabled={readonly}
                            onChange={e => updateSecretToAdd({
                                ...dialogItem,
                                password: e.target.value
                            })}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            id="url"
                            label={t('secrets.dialog.content.url')}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={dialogItem.url}
                            disabled={readonly}
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
                    label={t('secrets.dialog.content.notes')}
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.notes}
                    disabled={readonly}
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
