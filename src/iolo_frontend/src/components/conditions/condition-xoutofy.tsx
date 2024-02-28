import * as React from 'react';
import {FC} from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {UiLastLoginTimeCondition, UiUser, UiValidator, UiXOutOfYCondition} from "../../services/IoloTypesForUi";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import {Trans, useTranslation} from "react-i18next";
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions} from "../../redux/policies/policiesSlice";
import {useSelector} from "react-redux";
import {selectContacts} from "../../redux/contacts/contactsSelectors";
import {SelectListItem} from "../selectlist/select-list";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import {MenuItem, Select} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TextField from "@mui/material/TextField";

export interface ConditionXOutOfYProps {
    condition: UiXOutOfYCondition
    readonly?: boolean
    open: boolean
}

interface SelectedValidator extends SelectListItem, UiValidator {
}

export const ConditionXOutOfY: FC<ConditionXOutOfYProps> = ({condition, readonly, open}) => {
    const {t} = useTranslation();
    const dispatch = useAppDispatch();
    const contacts: UiUser[] = useSelector(selectContacts);

    const handleValidatorChange = (userId: string, index: number) => {
        const newValidators = [...condition.validators];
        const selectedValidator = contacts.find(s => s.id === userId);
        newValidators[index] = {user: selectedValidator, status: false};
        let updatedCondition = {
            ...condition,
            validators: newValidators
        }
        dispatch(policiesActions.updateConditionOfDialogItem(updatedCondition))
    }

    const addValidator = () => {
        const updatedConditon = {
            ...condition,
            validators: [
                ...(condition.validators ? condition.validators : [])
            ]
        }
        updatedConditon.validators.push({
            status: false,
            user: {}
        })
        dispatch(policiesActions.updateConditionOfDialogItem(updatedConditon))
    }

    const deleteValidator = (validator: UiValidator) => {
        const updatedConditon = {
            ...condition,
            validators: [
                ...(condition.validators ? condition.validators.filter(v => v.user.id !== validator.user.id) : [])
            ]
        }
        dispatch(policiesActions.updateConditionOfDialogItem(updatedConditon))
    }

    const getValidatorName = (user: UiUser) => {
        if(user.name) {
            return user.name;
        }else {
            const c = contacts.find(c => c.id === user.id);
            if(c?.name) {
                return c.name;
            }
        }
        return user.id
    }

    const updateCondition = (condition: UiXOutOfYCondition) => {
        dispatch(policiesActions.updateConditionOfDialogItem(condition))
    }

    if (readonly) {
        return (
            <TableRow>
                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{margin: 1}}>
                            <Typography variant="body2">
                                {t('conditions.xoutofy.question')}
                            </Typography>
                            <div>
                                {condition?.question}
                            </div>
                            <Typography variant="body2">
                                {t('conditions.xoutofy.min-validators')}
                            </Typography>
                            <div>
                                {condition?.quorum}
                            </div>
                            <Typography variant="body2">
                                {t('conditions.xoutofy.valdiators')}
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('user.name')}</TableCell>
                                        <TableCell>{t('conditions.status')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {condition?.validators?.map((validator) => (
                                        <TableRow key={validator.user.id}>
                                            <TableCell component="th" scope="row">
                                                {getValidatorName(validator.user)}
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
                        <TextField
                            autoFocus
                            margin="dense"
                            id="question"
                            label={t('conditions.xoutofy.question')}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={condition.question}
                            onChange={e => updateCondition({
                                ...condition,
                                question: e.target.value
                            })}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            id="question"
                            label={t('conditions.xoutofy.min-validators')}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={condition.quorum}
                            onChange={e => updateCondition({
                                ...condition,
                                quorum: Number(e.target.value)
                            })}
                        />
                        <Typography variant="body2">
                            {t('conditions.xoutofy.valdiators')}
                        </Typography>
                        <Table size="small" aria-label="purchases">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('user.name')}</TableCell>
                                    <TableCell>{t('conditions.status')}</TableCell>
                                    <TableCell>{t('conditions.delete')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {condition?.validators?.map((validator, index) => (
                                    <TableRow key={index}>
                                        <TableCell component="th" scope="row">
                                            <Select
                                                id="validator-select"
                                                value={validator?.user?.name}
                                                onChange={(e) => handleValidatorChange(
                                                    e.target.value,
                                                    index
                                                )}
                                            >
                                                {contacts
                                                    .map(user => {
                                                        return <MenuItem key={user.id}
                                                                         value={user.id}>{user.name ? user.name : user.id}</MenuItem>
                                                    })

                                                }
                                            </Select>
                                        </TableCell>
                                        <TableCell>{validator.status}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                aria-label="expand row"
                                                size="small"
                                                onClick={() => deleteValidator(validator)}
                                            >
                                                <DeleteOutlineIcon/>
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div>
                            <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={() => addValidator()}
                            >
                                <AddIcon/><Trans i18nKey="validators.button.add"/>
                            </IconButton>
                        </div>
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}
