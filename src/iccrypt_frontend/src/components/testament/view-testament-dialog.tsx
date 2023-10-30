import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {testamentsActions} from "../../redux/testaments/testamentsSlice";
import {
    selectShowViewTestamentDialog,
    selectTestamentDialogItemState,
    selectTestamentError
} from "../../redux/testaments/testamentsSelectors";
import {BasicDialog} from "../dialog/basic-dialog";
import {TestamentDialogContent} from './testament-dialog-content';
import {SelectListItem} from "../selectlist/select-list";
import {getSecretInViewModeThunk} from "../../redux/secrets/secretsSlice";

export default function ViewTestamentDialog() {
    const dispatch = useAppDispatch();
    const showViewTestamentDialog = useSelector(selectShowViewTestamentDialog);
    const testamentError = useSelector(selectTestamentError);
    const dialogItemState = useSelector(selectTestamentDialogItemState);

    const handleClose = () => {
        dispatch(testamentsActions.closeViewDialog());
    };

    const viewSecret = (value: SelectListItem) => {
        dispatch(getSecretInViewModeThunk(value.id))
    }


    return (
        <BasicDialog title="View testament"
                     leadText="This is your testament."
                     isOpen={showViewTestamentDialog}
                     handleClose={handleClose}
                     error={testamentError}
                     dialogItemState={dialogItemState}>
            <TestamentDialogContent readonly={true} viewSecret={viewSecret}/>
        </BasicDialog>
    );
}
