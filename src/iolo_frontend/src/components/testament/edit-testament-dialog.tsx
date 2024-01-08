import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {testamentsActions, updateTestamentThunk} from "../../redux/testaments/testamentsSlice";
import {
    selectShowEditTestamentDialog,
    selectTestamentDialogItem,
    selectTestamentDialogItemState,
    selectTestamentError
} from "../../redux/testaments/testamentsSelectors";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {BasicDialog} from "../dialog/basic-dialog";
import {TestamentDialogContent} from './testament-dialog-content';
import {UiTestamentResponse} from "../../services/IoloTypesForUi";
import {useTranslation} from "react-i18next";

export default function EditTestamentDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showEditTestamentDialog = useSelector(selectShowEditTestamentDialog);
    const dialogItem: UiTestamentResponse = useSelector(selectTestamentDialogItem);
    const testamentError = useSelector(selectTestamentError);
    const dialogItemState = useSelector(selectTestamentDialogItemState);
    const currentUser = useSelector(selectCurrentUser);

    const handleClose = () => {
        dispatch(testamentsActions.closeEditDialog());
    };

    const cancelEditTestament = () => {
        dispatch(testamentsActions.cancelEditTestament());
    }

    const updateTestament = async () => {
        dispatch(updateTestamentThunk({
            ...dialogItem,
            secrets: dialogItem.secrets.map(s => s.id)
        }));
    }

    return (
        <BasicDialog title={t('testaments.dialog.edit.title')}
                     leadText={t('testaments.dialog.edit.text')}
                     isOpen={showEditTestamentDialog}
                     handleClose={handleClose}
                     cancelAction={cancelEditTestament}
                     okAction={updateTestament}
                     okButtonText={t('testaments.dialog.edit.button')}
                     error={testamentError}
                     dialogItemState={dialogItemState}>
            <TestamentDialogContent/>
        </BasicDialog>
    );
}
