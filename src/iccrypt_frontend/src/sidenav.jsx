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
            <Link to="vault"><i className="fa fa-fw fa-key"></i>My Vault</Link>
            <Link to="executor"><i className="fa fa-fw fa-wallet"></i>My Executor</Link>
            <Link to="settings"><i className="fa fa-fw fa-user"></i> Settings</Link>

        </div>
    );
};

export default Sidenav;






