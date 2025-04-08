import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { MantineProvider } from '@mantine/core';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux'
import Reducer  from './redux/reducer';

 
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import '@mantine/dates/styles.css';

import { Notifications } from '@mantine/notifications';
import { thunk } from 'redux-thunk';


const store = createStore(Reducer, applyMiddleware(thunk));
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
    <MantineProvider>
    <Notifications />
        <App /> 
        </MantineProvider > 
      </Provider> 
  </React.StrictMode> 
);

reportWebVitals();
