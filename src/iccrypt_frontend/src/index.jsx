import React from "react";
import { createRoot } from 'react-dom/client';

import Topnav from "./topnav";
import Sidenav from "./sidenav";
import { useState } from "react";
import Passwords from "./passwords/passwords";



const ICCrypt = () => {

  const [sidenavHidden, setSidenavHidden] = useState(true);



  const openSidenav = () => {
    setSidenavHidden(false);

  }

  const closeSidenav = () => {
    setSidenavHidden(true);

  }

  return (
    <div>
      <Topnav openSidenav={openSidenav} />
      <Sidenav closeSidenav={closeSidenav} isHidden={sidenavHidden} />

      <div className="home">
        <Passwords />
      </div>
    </div >
  );
};


const rootElement = document.getElementById('app');
const root = createRoot(rootElement);
root.render(<ICCrypt />);
