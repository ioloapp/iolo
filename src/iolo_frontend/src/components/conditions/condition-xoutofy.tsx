import * as React from 'react';
import {FC} from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {UiCondition, UiXOutOfYCondition} from "../../services/IoloTypesForUi";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import {useTranslation} from "react-i18next";
import {useAppDispatch} from "../../redux/hooks";
import {testamentsActions} from "../../redux/testaments/testamentsSlice";

export interface ConditionXOutOfYProps {
    condition: UiXOutOfYCondition
    readonly?: boolean
}

export const ConditionXOutOfY: FC<ConditionXOutOfYProps> = ({condition, readonly}) => {
    const {t} = useTranslation();
    const [open, setOpen] = React.useState(false);
    const dispatch = useAppDispatch();

    const deleteCondition = (condition: UiCondition) => {
        dispatch(testamentsActions.deleteConditionOfDialogItem(condition))
    }

    if (readonly) {
        return (
            <TableRow>
                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{margin: 1}}>
                            <Typography variant="h6" gutterBottom component="div">
                                {t('conditions.x-out-of-y')}
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('user.name')}</TableCell>
                                        <TableCell>{t('conditions.status')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(condition as UiXOutOfYCondition).validators.map((validator) => (
                                        <TableRow key={validator.user.id}>
                                            <TableCell component="th" scope="row">
                                                {validator.user.name ? validator.user.name : validator.user.id}
                                            </TableCell>
                                            <TableCell>{validator.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
                            {t('conditions.x-out-of-y')}
                        </Typography>
                        <Table size="small" aria-label="purchases">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('user.name')}</TableCell>
                                    <TableCell>{t('conditions.status')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(condition as UiXOutOfYCondition).validators.map((validator) => (
                                    <TableRow key={validator.user.id}>
                                        <TableCell component="th" scope="row">
                                            {validator.user.name ? validator.user.name : validator.user.id}
                                        </TableCell>
                                        <TableCell>{validator.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}
