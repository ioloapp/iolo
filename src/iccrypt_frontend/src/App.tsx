import * as React from 'react';

// Components
import SmartVault from "./pages/SmartVault";
import Settings from "./pages/Settings";
import Layout from "./pages/navigation/Layout";
import Home from './pages/Home';

// MUI
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<Layout />}>
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