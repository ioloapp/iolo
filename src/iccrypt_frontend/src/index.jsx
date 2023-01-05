import React from "react";
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Topnav from "./topnav";
import Sidenav from "./sidenav";
import { useState } from "react";
import Passwords from "./passwords/passwords";
import Executor from "./executor/executor";
import Settings from "./settings/settings";



const ICCrypt = () => {

  const [sidenavHidden, setSidenavHidden] = useState(true);

  const openSidenav = () => {
    setSidenavHidden(false);

  }

  const closeSidenav = () => {
    setSidenavHidden(true);

  }

  return (
    <Router>
      <div>
        <Topnav openSidenav={openSidenav} />
        <Sidenav closeSidenav={closeSidenav} isHidden={sidenavHidden} />

        <div className="home">
          <Routes>
            <Route path="/" element={<Passwords />} />
            <Route path="/vaults" element={<Passwords />} />
            <Route path="/passwords" element={<Passwords />} />
            <Route path="/executor" element={<Executor />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div >
    </Router>
  );
};


const rootElement = document.getElementById('app');
const root = createRoot(rootElement);
root.render(<ICCrypt />);
