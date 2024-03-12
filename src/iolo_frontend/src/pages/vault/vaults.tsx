import {Box, List, Typography} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {
    getSecretInViewModeThunk,
    getSecretThunk,
    loadSecretsThunk,
    secretsActions
} from "../../redux/secrets/secretsSlice";
import {PageLayout} from "../../components/layout/page-layout";
import PasswordIcon from '@mui/icons-material/Password';
import NotesIcon from '@mui/icons-material/Notes';
import DescriptionIcon from '@mui/icons-material/Description';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {useSelector} from "react-redux";
import {selectGroupedSecrets, selectSecretListState, selectSecretsError} from "../../redux/secrets/secretsSelectors";
import AddVaultDialog from "../../components/vault/add-vault-dialog";
import {UiSecretListEntry} from "../../services/IoloTypesForUi";
import {VaultItem} from "./vault-item";
import DeleteVaultDialog from "../../components/vault/delete-vault-dialog";
import EditVaultDialog from "../../components/vault/edit-vault-dialog";
import {Error} from "../../components/error/error";
import {SelectListItem} from "../../components/selectlist/select-list";
import ViewVaultDialog from "../../components/vault/view-vault-dialog";
import {useTranslation} from "react-i18next";

export function Vaults() {

    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const groupedSecretList = useSelector(selectGroupedSecrets);
    const secretsListState = useSelector(selectSecretListState);
    const secretsListError = useSelector(selectSecretsError);

    const [filteredSecretList, setFilteredSecretList] = useState(groupedSecretList)

    useEffect(() => {
        dispatch(loadSecretsThunk())
    }, [])

    useEffect(() => {
        setFilteredSecretList(groupedSecretList)
    }, [groupedSecretList])

    const deleteItem = (secret: UiSecretListEntry) => {
        dispatch(secretsActions.updateDialogItem(secret));
        dispatch(secretsActions.openDeleteDialog());
    }

    const editItem = (secret: UiSecretListEntry) => {
        dispatch(getSecretThunk(secret.id));
    }

    const viewItem = (value: SelectListItem) => {
        dispatch(getSecretInViewModeThunk({secretId: value.id}))
    }

    const filterSecretList = (search: string) => {
        const searchString = search.toLowerCase();
        if (searchString.length === 0) {
            setFilteredSecretList(groupedSecretList);
        } else {
            setFilteredSecretList({
                passwordList: groupedSecretList.passwordList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                documentsList: groupedSecretList.documentsList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                notesList: groupedSecretList.notesList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                othersList: groupedSecretList.othersList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
            })
        }
    }

    const hasError = (): boolean => {
        return secretsListState === 'failed';
    }

    return (
        <PageLayout title={t('secrets.title')} filterList={filterSecretList}>
            <>
                <Box sx={{width: '100%'}}>
                    {hasError() &&
                        <Error error={secretsListError}/>
                    }
                    {!hasError() && filteredSecretList &&
                        <>
                            {filteredSecretList.passwordList?.length > 0 &&
                                <Box>
                                    <Typography variant="h5">{t('secrets.passwords')}</Typography>
                                    <List dense={false}>
                                        {filteredSecretList.passwordList.map((secret: UiSecretListEntry) =>
                                            <VaultItem key={secret.id} secret={secret} editAction={editItem}
                                                       viewAction={viewItem}
                                                       deleteAction={deleteItem}><PasswordIcon/></VaultItem>
                                        )}
                                    </List>
                                </Box>
                            }
                            {filteredSecretList.notesList?.length > 0 &&
                                <Box>
                                    <Typography variant="h5">{t('secrets.notes')}</Typography>
                                    <List dense={false}>
                                        {filteredSecretList.notesList.map((secret: UiSecretListEntry) =>
                                            <VaultItem key={secret.id} secret={secret} editAction={editItem}
                                                       viewAction={viewItem}
                                                       deleteAction={deleteItem}><NotesIcon/></VaultItem>
                                        )}
                                    </List>
                                </Box>
                            }
                            {filteredSecretList.documentsList?.length > 0 &&
                                <Box>
                                    <Typography variant="h5">{t('secrets.documents')}</Typography>
                                    <List dense={false}>
                                        {filteredSecretList.documentsList.map((secret: UiSecretListEntry) =>
                                            <VaultItem key={secret.id} secret={secret} editAction={editItem}
                                                       viewAction={viewItem}
                                                       deleteAction={deleteItem}><DescriptionIcon/></VaultItem>
                                        )}
                                    </List>
                                </Box>
                            }
                            {filteredSecretList.othersList?.length > 0 &&
                                <Box>
                                    <Typography variant="h5">{t('secrets.no-category')}</Typography>
                                    <List dense={false}>
                                        {filteredSecretList.othersList.map((secret: UiSecretListEntry) =>
                                            <VaultItem key={secret.id} secret={secret} editAction={editItem}
                                                       viewAction={viewItem}
                                                       deleteAction={deleteItem}><QuestionMarkIcon/></VaultItem>
                                        )}
                                    </List>
                                </Box>
                            }
                        </>
                    }
                </Box>
                <ViewVaultDialog/>
                <AddVaultDialog/>
                <EditVaultDialog/>
                <DeleteVaultDialog/>
            </>
        </PageLayout>);
}
