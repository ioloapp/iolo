import * as React from "react";
import {FC} from "react";
import {ConditionType, UiCondition, UiPolicyListEntryRole, UiXOutOfYCondition} from "../../services/IoloTypesForUi";
import {Avatar, IconButton, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {useAppDispatch} from "../../redux/hooks";
import {useTranslation} from "react-i18next";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {confirmConditionThunk, declineConditionThunk} from "../../redux/policies/policiesSlice";

export interface ValidationListItemProps {
    ownerId: string;
    policyId: string;
    condition: UiCondition
}

export const ValidationListItem: FC<ValidationListItemProps> = ({ownerId, condition, policyId}) => {

    const dispatch = useAppDispatch();
    const {t} = useTranslation();

    const confirmCondition = (policyId: string, conditionId: string) => {
        dispatch(confirmConditionThunk({policyId, conditionId}))
    }

    const declineCondition = (policyId: string, conditionId: string) => {
        dispatch(declineConditionThunk({policyId, conditionId}))
    }

    const xouty = condition.type === ConditionType.XOutOfY ? condition as UiXOutOfYCondition : undefined;

    return (
        <ListItem secondaryAction={
            <>
                {
                    condition.conditionStatus === undefined &&
                    <>
                        <IconButton edge="end" aria-label="view"
                                    onClick={() => confirmCondition(policyId, condition.id)}>
                            <CheckIcon/>
                        </IconButton>
                        <IconButton edge="end" aria-label="edit"
                                    onClick={() => declineCondition(policyId, condition.id)}>
                            <CloseIcon/>
                        </IconButton>
                    </>
                }
                {
                    condition.conditionStatus &&
                            <CheckIcon/>
                }
                {
                    condition.conditionStatus === false &&
                    <CloseIcon/>
                }
            </>
        }>
            <ListItemAvatar>
                <Avatar>
                    <QuestionMarkIcon/>
                </Avatar>
            </ListItemAvatar>
            {xouty &&
                <ListItemText
                primary={xouty.question}
                secondary={`${t('validations.owner')}: ${ownerId}`}
                />
            }
        </ListItem>
    )
}
