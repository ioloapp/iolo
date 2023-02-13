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
import SmartVault from "./smart_vault/smart_vault";
import Executor from "./executor/executor";
import Settings from "./settings/settings";

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
            <div>
                <Topnav openSidenav={openSidenav} />
                <Sidenav closeSidenav={closeSidenav} isHidden={sidenavHidden} />

                <div className="home">
                    <Routes>
                        <Route path="/" element={<SmartVault />} />
                        <Route path="/vault" element={<SmartVault />} />
                        <Route path="/executor" element={<Executor />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </div>
            </div >
        </Router>
    );
}

export default App;