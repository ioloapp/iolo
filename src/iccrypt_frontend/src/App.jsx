import React from "react";
import SmartVault from "./pages/SmartVault";
import Settings from "./pages/Settings";
import NavigationBar from "./pages/navigation/NavigationBar";
import Home from './pages/Home';
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<NavigationBar />}>
            <Route index element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/vault" element={<SmartVault />} />
            <Route path="/settings" element={<Settings />} />
        </Route>
    )
);

function App() {
    return (
        <RouterProvider router={router} />
    );
}

export default App;