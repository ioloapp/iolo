import {styled} from "@mui/material/styles";
import {AppBar, TextField} from "@mui/material";

export const StyledAppBar = styled(AppBar)(() => ({
    position: 'fixed',
    top: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: '5px 10px 5px 10px'
}));

export const SearchField = styled(TextField)(() => ({
    width: '100%',
    boxShadow: 'none'
}));
