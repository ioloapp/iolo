import * as React from 'react';
import {FC} from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {UiFixedDateTimeCondition} from "../../services/IoloTypesForUi";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useTranslation} from "react-i18next";
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions} from "../../redux/policies/policiesSlice";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/de';

export interface ConditionFixedDateTimeProps {
    condition: UiFixedDateTimeCondition
    readonly?: boolean,
    open: boolean,
    className?: string
}

export const ConditionFixedDateTime: FC<ConditionFixedDateTimeProps> = ({condition, readonly, open, className}) => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();

    const updateCondition = (condition: UiFixedDateTimeCondition) => {
        dispatch(policiesActions.updateConditionOfDialogItem(condition))
    }

    if (readonly) {
        return (
            <TableRow className={className}>
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
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
                        <DateTimePicker
                            value={dayjs(condition.datetime)}
                            defaultValue={dayjs()}
                            onAccept={date => updateCondition({
                                ...condition,
                                datetime: date.toDate().getTime()
                            })}
                        />
                    </LocalizationProvider>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}
