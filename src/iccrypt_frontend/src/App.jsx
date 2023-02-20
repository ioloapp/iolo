import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom";
import SmartVault from "./pages/SmartVault";
import Settings from "./pages/Settings";
import NavigationBar from "./pages/navigation/NavigationBar";
import Home from './pages/Home';


function App() {

    return (
        <Router>
            <NavigationBar/>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/vault" element={<SmartVault />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Router>
    );
}

export default App;