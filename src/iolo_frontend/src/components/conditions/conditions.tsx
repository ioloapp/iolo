import * as React from 'react';
import {FC, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {Trans, useTranslation} from "react-i18next";
import {ConditionType, UiCondition} from "../../services/IoloTypesForUi";
import {Condition} from "./condition";
import IconButton from "@mui/material/IconButton";
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions} from "../../redux/policies/policiesSlice";
import {v4 as uuidv4} from 'uuid';
import AddIcon from '@mui/icons-material/Add';

export interface ConditionsProps {
    conditions: Array<UiCondition>
    readonly?: boolean
}

export const Conditions: FC<ConditionsProps> = ({conditions, readonly}) => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();
    const [openConditionId, setOpenConditionId] = useState();

    const addCondition = () => {
        const newConditionId = uuidv4()
        dispatch(policiesActions.addConditionToDialogItem({
            id: newConditionId,
            conditionStatus: false,
            type: ConditionType.Undefined,
        }));
        setOpenConditionId(newConditionId)
    }

    return (
        <>
            <TableContainer component={Paper}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell/>
                            <TableCell>{t('conditions.status')}</TableCell>
                            <TableCell>{t('conditions.type')}</TableCell>
                            <TableCell>{t('conditions.delete')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {conditions?.map((condition) => (
                            <Condition key={condition.id} condition={condition} readonly={readonly} openConditionId={openConditionId}/>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {!readonly &&
            <div>
                <IconButton
                    aria-label="expand row"
                    size="small"
                    onClick={() => addCondition()}
                >
                    <AddIcon/><Trans i18nKey="conditions.button.add"/>
                </IconButton>
            </div>
            }
        </>
    );
}
