import * as React from 'react';
import {FC} from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {UiLastLoginTimeCondition} from "../../services/IoloTypesForUi";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useTranslation} from "react-i18next";
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions} from "../../redux/policies/policiesSlice";
import TextField from "@mui/material/TextField";

export interface ConditionLastLoginProps {
    condition: UiLastLoginTimeCondition
    readonly?: boolean,
    open: boolean,
    className?: string
}

export const ConditionLastLogin: FC<ConditionLastLoginProps> = ({condition, readonly, open, className}) => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();

    const updateCondition = (condition: UiLastLoginTimeCondition) => {
        dispatch(policiesActions.updateConditionOfDialogItem(condition))
    }

    if (readonly) {
        return (
            <TableRow className={className}>
                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{margin: 1}}>
                            <Typography variant="body2">
                                {t('conditions.max-logout-time')}: {(condition as UiLastLoginTimeCondition).numberOfDaysSinceLastLogin}
                            </Typography>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow>
            <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="max-time"
                        label={t('conditions.timebased.max-logout-time')}
                        InputLabelProps={{shrink: true}}
                        fullWidth
                        type="number"
                        variant="standard"
                        value={condition.numberOfDaysSinceLastLogin}
                        onChange={e => updateCondition({
                            ...condition,
                            numberOfDaysSinceLastLogin: Number(e.target.value)
                        })}
                    />
                </Collapse>
            </TableCell>
        </TableRow>
    );
}
