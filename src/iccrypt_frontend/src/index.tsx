import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

// Components
import App from './App';

// Redux
import { store } from './redux/store';
import { Provider } from 'react-redux';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);