import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

/*import React from 'react';
import ReactDOM from 'react-dom/client';
import PainelInterno from './PainelInterno';

// 👇 ESTA É A LINHA MÁGICA QUE FALTOU (Ajuste o nome se o seu arquivo CSS for outro, como index.css)
import './styles.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <PainelInterno />
    </React.StrictMode>
);*/