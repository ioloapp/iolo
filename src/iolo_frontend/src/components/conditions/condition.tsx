import * as React from 'react';
import {FC} from 'react';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {ConditionType, UiCondition, UiTimeBasedCondition, UiXOutOfYCondition} from "../../services/IoloTypesForUi";
import {useTranslation} from "react-i18next";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useAppDispatch} from "../../redux/hooks";
import {testamentsActions} from "../../redux/testaments/testamentsSlice";
import {ConditionTimebased} from "./condition-timebased";
import {ConditionXOutOfY} from "./condition-xoutofy";
import {FormControl, MenuItem, Select, Typography} from "@mui/material";

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

    const updateCondition = (condition: UiCondition) => {
        dispatch(testamentsActions.updateConditionOfDialogItem(condition))
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
            {condition.type === ConditionType.TimeBasedCondition &&
                <ConditionTimebased condition={condition as UiTimeBasedCondition} readonly={readonly} open={open}/>
            }
            {condition.type === ConditionType.XOutOfYCondition &&
                <ConditionXOutOfY condition={condition as UiXOutOfYCondition} readonly={readonly} open={open}/>
            }

        </>
    );
}
