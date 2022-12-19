import * as React from "react";
import { useRef, useState } from "react";

const Sidenav = (props) => {

    console.log(props);
    return (
        <div className={!props.isHidden ? 'sidenav' : 'sidenav hidden'}>
            <a onClick={props.closeSidenav} href="#close" className="close"><i className="fa fa-fw fa-xmark"></i></a>
            <a href="#home"><img src="bw_logo.svg" alt="" /></a>
            <a href="#passwords"><i className="fa fa-fw fa-key"></i> Passwords</a>
            <a href="#services"><i className="fa fa-fw fa-wallet"></i> Wallets</a>
            <a href="#clients"><i className="fa fa-fw fa-user"></i> Settings</a>

        </div>
    );
};

export default Sidenav;






