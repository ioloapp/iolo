import * as React from 'react';
import {FC} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {useTranslation} from "react-i18next";
import {UiTimeBasedCondition, UiXOutOfYCondition} from "../../services/IoloTypesForUi";
import {Condition} from "./condition";

export interface ConditionsProps {
    conditions: Array<UiTimeBasedCondition | UiXOutOfYCondition>
}

export const Conditions: FC<ConditionsProps> = ({conditions}) => {
    const {t} = useTranslation();

    return (
        <>
            <TableContainer component={Paper}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell/>
                            <TableCell>{t('conditions.order')}</TableCell>
                            <TableCell>{t('conditions.status')}</TableCell>
                            <TableCell>{t('conditions.type')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {conditions.map((condition) => (
                            <Condition key={condition.id} condition={condition}/>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}
