import * as React from 'react';
import {FC, useEffect} from 'react';
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
import dayjs from 'dayjs';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import {useSelector} from "react-redux";
import {selectCurrentUser} from "../../redux/user/userSelectors";

export interface ConditionFixedDateTimeProps {
    condition: UiFixedDateTimeCondition
    readonly?: boolean,
    open: boolean,
    className?: string
}

export const ConditionFixedDateTime: FC<ConditionFixedDateTimeProps> = ({condition, readonly, open, className}) => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();
    const currentUser = useSelector(selectCurrentUser);

    useEffect(() => {
        if(currentUser?.language){
            dayjs.locale(currentUser.language)
        }
    }, [currentUser]);

    const updateCondition = (condition: UiFixedDateTimeCondition) => {
        dispatch(policiesActions.updateConditionOfDialogItem(condition))
    }

    if (readonly) {
        const dateOfEvent = condition?.datetime ? dayjs(condition.datetime).format('DD/MM/YYYY mm:ss'): '';
        return (
            <TableRow className={className}>
                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{margin: 1}}>
                            <Typography variant="body2">
                                {t('conditions.fixeddatetime.date-of-event')}: {dateOfEvent}
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
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={currentUser?.language}>
                        <DateTimePicker
                            value={dayjs(condition.datetime)}
                            defaultValue={dayjs()}
                            onAccept={date => updateCondition({
                                ...condition,
                                datetime: date.toDate()
                            })}
                        />
                    </LocalizationProvider>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}
