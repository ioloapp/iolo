import * as React from 'react';
import {FC, useEffect} from 'react';
import TextField from '@mui/material/TextField';
import {useSelector} from "react-redux";
import {selectGroupedSecrets} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {FormControl, Typography} from "@mui/material";
import {UiPolicyResponse, UiSecretListEntry, UiUser} from "../../services/IoloTypesForUi";
import {policiesActions} from "../../redux/policies/policiesSlice";
import {selectPolicyDialogItem} from "../../redux/policies/policiesSelectors";
import {selectContacts} from "../../redux/contacts/contactsSelectors";
import {SelectList, SelectListItem} from "../selectlist/select-list";
import {useTranslation} from "react-i18next";
import {Conditions} from "../conditions/conditions";


export interface PolicyDialogContentProps {
    viewSecret?: (value: SelectListItem) => any;
    readonly?: boolean;
}

interface SelectedBeneficiary extends SelectListItem, UiUser {
}

interface SelectedSecret extends SelectListItem, UiSecretListEntry {
}

export const PolicyDialogContent: FC<PolicyDialogContentProps> = ({readonly, viewSecret}) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const dialogItem: UiPolicyResponse = useSelector(selectPolicyDialogItem);
    const groupedSecretList = useSelector(selectGroupedSecrets);
    const contacts = useSelector(selectContacts);
    const [selectedSecrets, setSelectedSecrets] = React.useState<SelectedSecret[]>([]);
    const [selectedContacts, setSelectedContacts] = React.useState<SelectedBeneficiary[]>([]);

    useEffect(() => {
        if (readonly){
            setSelectedSecrets(dialogItem.secrets);
            setSelectedContacts(dialogItem.beneficiaries);
        } else {
            const contactsSelection = contacts.map(h => {
                const heir = dialogItem.beneficiaries.find(dh => dh.id === h.id);
                return heir ? {...h, selected: true} : {...h, selected: false};
            })
            setSelectedContacts(contactsSelection)
            const selectedSecrets = [...groupedSecretList.passwordList, ...groupedSecretList.notesList, ...groupedSecretList.documentsList, ...groupedSecretList.othersList].map(s => {
                const secret = dialogItem.secrets.find(ds => ds.id === s.id);
                return secret ? {...s, selected: true} : {...s, selected: false};
            })
            setSelectedSecrets(selectedSecrets)
        }
    }, [dialogItem]);

    const updatePolicyToAdd = (policyResponse: UiPolicyResponse) => {
        dispatch(policiesActions.updateDialogItem(policyResponse))
    }

    const handleSecretChange = (secret: SelectedSecret) => {
        const oldState = dialogItem.secrets.find(s => s.id === secret.id);
        let secrets: UiSecretListEntry[];
        if (oldState) {
            //not selected
            secrets = dialogItem.secrets.filter(s => s.id !== secret.id);
            setSelectedSecrets(selectedSecrets.map(s => s.id !== secret.id ? s : {...s, selected: false}));
        }else{
            //selected
            secrets = [...dialogItem.secrets, secret]
            setSelectedSecrets(selectedSecrets.map(s => s.id !== secret.id ? s : {...s, selected: true}));
        }
        //Add
        dispatch(policiesActions.updateDialogItem({
            ...dialogItem,
            secrets
        } as UiPolicyResponse))
    };

    const handleBeneficiaryChange = (heir: SelectedBeneficiary) => {
        const oldState = dialogItem.beneficiaries.find(s => s.id === heir.id);
        let beneficiaries: UiUser[];
        if (oldState) {
            //not selected
            beneficiaries = dialogItem.beneficiaries.filter(s => s.id !== heir.id)
            setSelectedContacts(selectedContacts.map(s => s.id !== heir.id ? s : {...s, selected: false}));
        }else{
            //selected
            beneficiaries = [...dialogItem.beneficiaries, heir]
            setSelectedContacts(selectedContacts.map(s => s.id !== heir.id ? s : {...s, selected: true}));
        }
        //Add
        dispatch(policiesActions.updateDialogItem({
            ...dialogItem,
            beneficiaries: beneficiaries
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
        <>
            <FormControl fullWidth>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label={t('policies.dialog.content.name')}
                    InputLabelProps={{shrink: true}}
                    fullWidth
                    variant="standard"
                    value={dialogItem.name}
                    disabled={readonly}
                    onChange={e => updatePolicyToAdd({
                        ...dialogItem,
                        name: e.target.value
                    })}
                />
            </FormControl>
            <FormControl fullWidth>
                <Typography variant="body2">{t('policies.dialog.content.secrets')}</Typography>
                <SelectList handleToggle={handleSecretChange} listItem={selectedSecrets} readonly={readonly} viewItem={viewSecret}/>
            </FormControl>
            <FormControl fullWidth>
                <Typography variant="body2">{t('policies.dialog.content.beneficiaries')}</Typography>
                <SelectList handleToggle={handleBeneficiaryChange} listItem={selectedContacts} readonly={readonly}/>
            </FormControl>
            <FormControl fullWidth>
                <Conditions conditions={dialogItem.conditions} readonly={readonly} />
            </FormControl>
        </>
    );
}
