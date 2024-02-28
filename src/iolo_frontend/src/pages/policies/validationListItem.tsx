import * as React from "react";
import {FC, useState} from "react";
import {ConditionType, UiCondition, UiPolicyListEntryRole, UiXOutOfYCondition} from "../../services/IoloTypesForUi";
import {
    Avatar,
    IconButton,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ToggleButton,
    ToggleButtonGroup
} from "@mui/material";
import {useAppDispatch} from "../../redux/hooks";
import {useTranslation} from "react-i18next";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {confirmConditionThunk, declineConditionThunk} from "../../redux/policies/policiesSlice";
import {b} from "vitest/dist/reporters-QGe8gs4b";

export interface ValidationListItemProps {
    ownerId: string;
    policyId: string;
    condition: UiCondition
}

export const ValidationListItem: FC<ValidationListItemProps> = ({ownerId, condition, policyId}) => {

    const xouty = condition.type === ConditionType.XOutOfY ? condition as UiXOutOfYCondition : undefined;
    const dispatch = useAppDispatch();
    const {t} = useTranslation();
    const [conditionStatus, setConditionStatus] = useState(xouty?.validators?.length > 0 ? xouty.validators[0].status : undefined)

    const handleConditionChange = (policyId: string, conditionId: string, newStatus: boolean) => {
        console.log(newStatus, conditionStatus)
        if(newStatus !== null && conditionStatus !== newStatus) {
            if (newStatus == true) {
                dispatch(confirmConditionThunk({policyId, conditionId}))
            } else {
                dispatch(declineConditionThunk({policyId, conditionId}))
            }
            setConditionStatus(!conditionStatus);
        }
    }

    return (
        <ListItem secondaryAction={
            <ToggleButtonGroup
                value={conditionStatus}
                exclusive
                onChange={(_event, value) => handleConditionChange(policyId, condition.id, value)}
                aria-label="text alignment"
            >
                <ToggleButton value={true}>
                    <CheckIcon/>
                </ToggleButton>
                <ToggleButton value={false}>
                    <CloseIcon/>
                </ToggleButton>
            </ToggleButtonGroup>
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
