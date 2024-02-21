import {FC} from "react";
import {UiPolicy, UiPolicyListEntryRole} from "../../services/IoloTypesForUi";
import {Avatar, IconButton, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import * as React from "react";
import {editPolicyThunk, policiesActions, viewPolicyThunk} from "../../redux/policies/policiesSlice";
import {useAppDispatch} from "../../redux/hooks";
import {useTranslation} from "react-i18next";

export interface PolicyListItemProps {
    policy: UiPolicy
}

export const PolicyListItem: FC<PolicyListItemProps> = ({policy}) => {

    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    const deletePolicy = (uiPolicy: UiPolicy) => {
        dispatch(policiesActions.updateDialogItem({id: uiPolicy.id, name: uiPolicy.name}));
        dispatch(policiesActions.openDeleteDialog());
    }

    const viewPolicy = (uiPolicy: UiPolicy) => {
        dispatch(viewPolicyThunk(uiPolicy));
    }

    const editPolicy = (uiPolicy: UiPolicy) => {
        dispatch(editPolicyThunk(uiPolicy));
    }

    return (
        <ListItem secondaryAction={
            <>
                {
                    policy.role === UiPolicyListEntryRole.Owner &&
                    <>
                        <IconButton edge="end" aria-label="view"
                                    onClick={() => viewPolicy(policy)}>
                            <VisibilityOutlinedIcon/>
                        </IconButton>
                        <IconButton edge="end" aria-label="edit"
                                    onClick={() => editPolicy(policy)}>
                            <EditOutlinedIcon/>
                        </IconButton>
                        <IconButton edge="end" aria-label="delete"
                                    onClick={() => deletePolicy(policy)}>
                            <DeleteIcon/>
                        </IconButton>
                    </>
                }
                {
                    policy.role === UiPolicyListEntryRole.Beneficiary && !policy.conditionsStatus &&
                    <LockOutlinedIcon/>
                }
                {
                    (policy.role === UiPolicyListEntryRole.Validator || (policy.role === UiPolicyListEntryRole.Beneficiary && policy.conditionsStatus)) &&
                    <IconButton edge="end" aria-label="view"
                                onClick={() => viewPolicy(policy)}>
                        <VisibilityOutlinedIcon/>
                    </IconButton>
                }
            </>
        }>
            <ListItemAvatar>
                <Avatar>
                    <HistoryEduOutlinedIcon/>
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={policy.name}
                secondary={policy.role === UiPolicyListEntryRole.Beneficiary ? `${t('policies.beneficiary')}: ${policy.owner?.id}` : ''}
            />
        </ListItem>
    )
}
