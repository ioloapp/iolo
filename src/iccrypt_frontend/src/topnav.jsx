import * as React from "react";
import { useRef, useState } from "react";

const Topnav = (props) => {

    return (
        <div className="topnav">
            <a onClick={props.openSidenav} href="#"><i className="fa fa-bars"></i></a>
            <a href="#" className="split"><i className="fa fa-add"></i></a>
            <input className="split" type="text" id="mySearch" placeholder="Search.." />
            {/* <a href="#" className="split"><i className="fa fa-search"></i></a> */}


        </div>
    );
};

export default Topnav;






