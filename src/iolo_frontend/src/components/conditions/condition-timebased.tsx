import * as React from 'react';
import {FC} from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {UiTimeBasedCondition} from "../../services/IoloTypesForUi";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useTranslation} from "react-i18next";
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions} from "../../redux/policies/policiesSlice";
import TextField from "@mui/material/TextField";

export interface ConditionTimebasedProps {
    condition: UiTimeBasedCondition
    readonly?: boolean,
    open: boolean
}

export const ConditionTimebased: FC<ConditionTimebasedProps> = ({condition, readonly, open}) => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();

    const updateCondition = (condition: UiTimeBasedCondition) => {
        dispatch(policiesActions.updateConditionOfDialogItem(condition))
    }

    if (readonly) {
        return (
            <TableRow>
                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{margin: 1}}>
                            <Typography variant="body2">
                                {t('conditions.max-logout-time')}: {(condition as UiTimeBasedCondition).numberOfDaysSinceLastLogin}
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
                        label={t('conditions.max-logout-time')}
                        InputLabelProps={{shrink: true}}
                        fullWidth
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
