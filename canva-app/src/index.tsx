import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppUiProvider } from '@canva/app-ui-kit'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppUiProvider>
            <App />
        </AppUiProvider>
    </React.StrictMode>,
)
