import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import PainelInterno from './PainelInterno';
import './styles.css';

const caminhoAtual = window.location.pathname;

const componente =
    caminhoAtual === '/painel-interno' ? (
        <PainelInterno />
    ) : (
        <App />
    );

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>{componente}</React.StrictMode>
);