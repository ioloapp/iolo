import {Checkbox, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import * as React from "react";
import {FC} from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";


export interface SelectListItem {
    selected?: boolean,
    name?: string,
    id?: string,
    readonly?: boolean
}


export interface SelectListProps {
    listItem: SelectListItem[];
    handleToggle: (value: SelectListItem) => any;
    viewItem?: (value: SelectListItem) => any;
    readonly?: boolean
}

export const SelectList: FC<SelectListProps> = ({handleToggle, listItem, readonly, viewItem}) => {

    return (
        <List sx={{width: '100%', bgcolor: 'background.paper', maxHeight: '200px', overflowY: 'scroll'}}>
            {listItem?.map((item) => {
                return (
                    <ListItem
                        key={item.id}
                        secondaryAction={
                            viewItem &&
                            <IconButton edge="end" aria-label="view secret" onClick={() => viewItem(item)}>
                                <VisibilityOutlinedIcon/>
                            </IconButton>
                        }
                        disablePadding
                    >
                        <ListItemButton role={undefined} onClick={() => handleToggle(item)} dense>
                            {!readonly && <ListItemIcon>
                                <Checkbox
                                    edge="start"
                                    checked={item.selected}
                                    tabIndex={-1}
                                    disableRipple
                                    disabled={readonly}
                                />
                            </ListItemIcon>}
                            <ListItemText id={item.id} primary={item.name ? item.name : item.id}/>
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    )
}
