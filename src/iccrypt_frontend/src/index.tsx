import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App'
import './index.css'
import {Provider} from 'react-redux'
import {persistor, store} from './redux/store'
import {PersistGate} from "redux-persist/integration/react";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <App />
          </PersistGate>
      </Provider>
  </React.StrictMode>,
)
