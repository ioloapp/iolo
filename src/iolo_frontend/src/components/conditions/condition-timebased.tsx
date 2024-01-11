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
import {testamentsActions} from "../../redux/testaments/testamentsSlice";

export interface ConditionTimebasedProps {
    condition: UiTimeBasedCondition
    readonly?: boolean
}

export const ConditionTimebased: FC<ConditionTimebasedProps> = ({condition, readonly}) => {
    const {t} = useTranslation();
    const [open, setOpen] = React.useState(false);
    const dispatch = useAppDispatch();

    const deleteCondition = (condition: UiTimeBasedCondition) => {
        dispatch(testamentsActions.deleteConditionOfDialogItem(condition))
    }

    if (readonly) {
        return (
            <TableRow>
                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{margin: 1}}>
                            <Typography variant="h6" gutterBottom component="div">
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
                    <Box sx={{margin: 1}}>
                        <Typography variant="h6" gutterBottom component="div">
                            {t('conditions.max-logout-time')}: {(condition as UiTimeBasedCondition).numberOfDaysSinceLastLogin}
                        </Typography>
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}
