import React from 'react';
import App from './jsx/App.jsx';

import { createRoot } from 'react-dom/client';
const container = document.getElementById('app-root-2022-fdi_flows');
const root = createRoot(container);
root.render(<App/>);