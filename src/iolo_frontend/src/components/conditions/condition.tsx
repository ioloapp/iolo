import * as React from 'react';
import {FC} from 'react';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {ConditionType, UiCondition, UiTimeBasedCondition, UiXOutOfYCondition} from "../../services/IoloTypesForUi";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import {useTranslation} from "react-i18next";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useAppDispatch} from "../../redux/hooks";
import {testamentsActions} from "../../redux/testaments/testamentsSlice";

export interface ConditionProps {
    condition: UiCondition
    readonly?: boolean
}

export const Condition: FC<ConditionProps> = ({condition, readonly}) => {
    const {t} = useTranslation();
    const [open, setOpen] = React.useState(false);
    const dispatch = useAppDispatch();

    const deleteCondition = (condition: UiCondition) => {
        dispatch(testamentsActions.deleteConditionOfDialogItem(condition))
    }

    if(readonly) {
        return (
            <>
                <TableRow sx={{'& > *': {borderBottom: 'unset'}}}>
                    <TableCell>
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                        </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row">
                        {condition.order}
                    </TableCell>
                    <TableCell>{condition.conditionStatus}</TableCell>
                    <TableCell>{condition.type}</TableCell>
                    <TableCell></TableCell>
                </TableRow>
                {condition.type === ConditionType.TimeBasedCondition &&
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
                }
                {condition.type === ConditionType.XOutOfYCondition &&
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
                                            {(condition as UiXOutOfYCondition).confirmers.map((confirmer) => (
                                                <TableRow key={confirmer.user.id}>
                                                    <TableCell component="th" scope="row">
                                                        {confirmer.user.name ? confirmer.user.name : confirmer.user.id}
                                                    </TableCell>
                                                    <TableCell>{confirmer.status}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                }

            </>
        );
    }

    return (
        <>
            <TableRow sx={{'& > *': {borderBottom: 'unset'}}}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {condition.order}
                </TableCell>
                <TableCell>{condition.conditionStatus}</TableCell>
                <TableCell>{condition.type}</TableCell>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => deleteCondition(condition)}
                    >
                        <DeleteOutlineIcon/>
                    </IconButton>
                </TableCell>
            </TableRow>
            {condition.type === ConditionType.TimeBasedCondition &&
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
            }
            {condition.type === ConditionType.XOutOfYCondition &&
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
                                        {(condition as UiXOutOfYCondition).confirmers.map((confirmer) => (
                                            <TableRow key={confirmer.user.id}>
                                                <TableCell component="th" scope="row">
                                                    {confirmer.user.name ? confirmer.user.name : confirmer.user.id}
                                                </TableCell>
                                                <TableCell>{confirmer.status}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            }

        </>
    );
}
