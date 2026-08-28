import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
    // Carrega variáveis com e sem o prefixo VITE_.
    // Necessário porque INTERNAL_API_KEY não pode ser exposta ao React.
    const env = loadEnv(mode, process.cwd(), '');

    const configuracao = {
        plugins: [react()],
    };

    // Proxy exclusivo do servidor de desenvolvimento local.
    if (command === 'serve') {
        if (!env.INTERNAL_API_KEY) {
            throw new Error(
                'INTERNAL_API_KEY não foi definida em frontend/.env.local.'
            );
        }

        configuracao.server = {
            proxy: {
                '/api/interno': {
                    target:
                        env.VITE_API_URL ||
                        'https://lda-canal-denuncia.eyg4rz.easypanel.host',

                    changeOrigin: true,

                    headers: {
                        'X-Internal-Api-Key':
                            env.INTERNAL_API_KEY,
                    },
                },
            },
        };
    }

    return configuracao;
});