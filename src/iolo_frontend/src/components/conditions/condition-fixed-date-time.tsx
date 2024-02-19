import * as React from 'react';
import {FC} from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {UiFixedDateTimeCondition, UiLastLoginTimeCondition} from "../../services/IoloTypesForUi";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useTranslation} from "react-i18next";
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions} from "../../redux/policies/policiesSlice";
import TextField from "@mui/material/TextField";
import {DateTimePicker} from "@mui/x-date-pickers";
import dayjs from "dayjs";

export interface ConditionFixedDateTimeProps {
    condition: UiFixedDateTimeCondition
    readonly?: boolean,
    open: boolean
}

export const ConditionFixedDateTime: FC<ConditionFixedDateTimeProps> = ({condition, readonly, open}) => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();

    const updateCondition = (condition: UiLastLoginTimeCondition) => {
        dispatch(policiesActions.updateConditionOfDialogItem(condition))
    }

    if (readonly) {
        return (
            <TableRow>
                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{margin: 1}}>
                            <Typography variant="body2">
                                {t('conditions.date-of-event')}: {condition.datetime}
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
                    <DateTimePicker
                        label="Uncontrolled picker"
                        value={dayjs(condition.datetime)}
                        defaultValue={dayjs()}
                    />
                </Collapse>
            </TableCell>
        </TableRow>
    );
}
