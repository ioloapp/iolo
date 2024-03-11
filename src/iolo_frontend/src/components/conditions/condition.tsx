import * as React from 'react';
import {FC, useEffect} from 'react';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
    ConditionType,
    UiCondition,
    UiFixedDateTimeCondition,
    UiLastLoginTimeCondition,
    UiXOutOfYCondition
} from "../../services/IoloTypesForUi";
import {useTranslation} from "react-i18next";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions} from "../../redux/policies/policiesSlice";
import {ConditionLastLogin} from "./condition-last-login";
import {ConditionXOutOfY} from "./condition-xoutofy";
import {FormControl, MenuItem, Select, Typography} from "@mui/material";
import {ConditionFixedDateTime} from "./condition-fixed-date-time";

export interface ConditionProps {
    condition?: UiCondition
    readonly?: boolean
    openConditionId?: string,
    className?: string
}

export const Condition: FC<ConditionProps> = ({condition, readonly, openConditionId, className}) => {
    const {t} = useTranslation();
    const [open, setOpen] = React.useState(false);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if(condition?.id === openConditionId){
            setOpen(true)
        }else{
            setOpen(false)
        }
    }, [openConditionId, condition]);

    const deleteCondition = (condition: UiCondition) => {
        dispatch(policiesActions.deleteConditionOfDialogItem(condition))
    }

    const updateCondition = (condition: UiCondition) => {
        dispatch(policiesActions.updateConditionOfDialogItem(condition))
    }

    if(!condition){
        return null;
    }

    return (
        <>
            <TableRow sx={{'& > *': {borderBottom: 'unset'}}} className={className}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                    </IconButton>
                </TableCell>
                <TableCell>{condition.conditionStatus}</TableCell>
                <TableCell>
                    {readonly && condition.type !== ConditionType.Undefined &&
                        <>{condition.type}</>
                    }
                    {!readonly &&
                        <FormControl fullWidth>
                            <Typography variant="body2">Category</Typography>
                            <Select
                                labelId="category-select-label"
                                id="type"
                                value={condition.type}
                                label="Category"
                                onChange={e => updateCondition({
                                    ...condition,
                                    type: ConditionType[e.target.value as keyof typeof ConditionType]
                                })}
                            >
                                {Object.keys(ConditionType)
                                    .map(key => {
                                        return <MenuItem key={key} value={key}>{key}</MenuItem>
                                    })

                                }
                            </Select>
                        </FormControl>
                    }
                </TableCell>
                <TableCell>
                    {!readonly &&
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => deleteCondition(condition)}
                        >
                            <DeleteOutlineIcon/>
                        </IconButton>
                    }
                </TableCell>
            </TableRow>
            {condition.type === ConditionType.LastLogin &&
                <ConditionLastLogin condition={condition as UiLastLoginTimeCondition} readonly={readonly} open={open} className={className}/>
            }
            {condition.type === ConditionType.FixedDateTime &&
                <ConditionFixedDateTime condition={condition as UiFixedDateTimeCondition} readonly={readonly} open={open} className={className}/>
            }
            {condition.type === ConditionType.XOutOfY &&
                <ConditionXOutOfY condition={condition as UiXOutOfYCondition} readonly={readonly} open={open} className={className}/>
            }

        </>
    );
}
