import React from "react";
import { createRoot } from 'react-dom/client';
import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom";
//import Topnav from "./topnav";
//import Sidenav from "./sidenav";
import { useState } from "react";
import SmartVault from "./smartVault/SmartVault";
import Settings from "./settings/Settings";
import NavigationBar from "./NavigationBar";

function App() {
    const [sidenavHidden, setSidenavHidden] = useState(true);

    const openSidenav = () => {
        setSidenavHidden(false);

    }

    const closeSidenav = () => {
        setSidenavHidden(true);

    }

    return (
        <Router>
            <NavigationBar/>
            <Routes>
                <Route path="/" element={<SmartVault />} />
                <Route path="/vault" element={<SmartVault />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Router>
    );
}

export default App;