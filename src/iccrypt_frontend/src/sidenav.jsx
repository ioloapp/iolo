import * as React from "react";
import {
    Link
} from "react-router-dom";

const Sidenav = (props) => {

    console.log(props);
    return (
        <div className={!props.isHidden ? 'sidenav' : 'sidenav hidden'}>
            <a onClick={props.closeSidenav} href="#close" className="close"><i className="fa fa-fw fa-xmark"></i></a>
            <a href="#home"><img src="bw_logo.svg" alt="" /></a>
            <Link to="vaults"><i className="fa fa-fw fa-key"></i> Vaults</Link>
            <Link to="executor"><i className="fa fa-fw fa-wallet"></i> Executor</Link>
            <Link to="settings"><i className="fa fa-fw fa-user"></i> Settings</Link>

        </div>
    );
};

export default Sidenav;






