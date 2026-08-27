import { useMemo, useState } from 'react';

const denunciasIniciais = [
    {
        protocolo: 'CDN-20260821-CZC2GP3P',
        tipoEnvio: 'ANONIMO',
        categoria: 'Conduta inadequada',
        riscoImediato: false,
        status: 'EM_TRIAGEM',
        criadoEm: '2026-08-21T18:25:35.024Z',
        pessoasEnvolvidas:
            'Supervisor do setor de expedição, turno da noite',
        descricao:
            'O supervisor realizou comentários ofensivos durante o turno e constrangeu a equipe na frente de outras pessoas.',
        localFato: 'Setor de expedição',
        mensagens: [
            {
                id: 1,
                autor: 'DENUNCIANTE',
                conteudo:
                    'Gostaria de acrescentar que o fato ocorreu durante uma reunião no turno da noite.',
                visivelDenunciante: true,
                criadoEm: '2026-08-21T19:42:33.616Z',
            },
            {
                id: 2,
                autor: 'RESPONSAVEL',
                conteudo:
                    'Seu relato foi recebido e está em análise.',
                visivelDenunciante: true,
                criadoEm: '2026-08-21T20:28:22.018Z',
            },
            {
                id: 3,
                autor: 'RESPONSAVEL',
                conteudo:
                    'Nota interna: verificar se existem relatos anteriores envolvendo a mesma área.',
                visivelDenunciante: false,
                criadoEm: '2026-08-21T20:29:12.856Z',
            },
        ],
        historico: [
            {
                id: 1,
                acao: 'CRIACAO',
                descricao: 'Relato anônimo registrado pelo canal público.',
                criadoEm: '2026-08-21T18:25:35.024Z',
            },
            {
                id: 2,
                acao: 'ALTERACAO_STATUS',
                descricao: 'Status alterado de Recebido para Em triagem.',
                criadoEm: '2026-08-21T20:27:17.290Z',
            },
        ],
    },
    {
        protocolo: 'CDN-20260821-K7M9X2PL',
        tipoEnvio: 'IDENTIFICADO',
        categoria: 'Assédio moral',
        riscoImediato: true,
        status: 'RECEBIDO',
        criadoEm: '2026-08-21T16:10:00.000Z',
        pessoasEnvolvidas: 'Gestor da área administrativa',
        descricao:
            'Foram relatadas cobranças excessivas, exposição constrangedora e ameaças recorrentes relacionadas a metas.',
        localFato: 'Área administrativa',
        denunciante: {
            nome: 'Dados identificáveis disponíveis somente no painel interno',
            email: 'contato@exemplo.com',
            telefone: '(00) 00000-0000',
        },
        mensagens: [],
        historico: [
            {
                id: 1,
                acao: 'CRIACAO',
                descricao: 'Relato identificado registrado pelo canal público.',
                criadoEm: '2026-08-21T16:10:00.000Z',
            },
        ],
    },
    {
        protocolo: 'CDN-20260820-A8P4L6RS',
        tipoEnvio: 'ANONIMO',
        categoria: 'Fraude ou irregularidade',
        riscoImediato: false,
        status: 'EM_APURACAO',
        criadoEm: '2026-08-20T14:30:00.000Z',
        pessoasEnvolvidas: 'Equipe de compras',
        descricao:
            'Foram identificadas possíveis inconsistências em processos de contratação de fornecedores.',
        localFato: 'Setor de compras',
        mensagens: [],
        historico: [],
    },
];

const statusPermitidos = [
    'RECEBIDO',
    'EM_TRIAGEM',
    'EM_APURACAO',
    'AGUARDANDO_INFORMACOES',
    'CONCLUIDO',
    'ARQUIVADO',
];

const nomesStatus = {
    RECEBIDO: 'Recebido',
    EM_TRIAGEM: 'Em triagem',
    EM_APURACAO: 'Em apuração',
    AGUARDANDO_INFORMACOES: 'Aguardando informações',
    CONCLUIDO: 'Concluído',
    ARQUIVADO: 'Arquivado',
};

function PainelInternoDemo() {
    const [denuncias, setDenuncias] = useState(denunciasIniciais);
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [protocoloSelecionado, setProtocoloSelecionado] = useState(
        denunciasIniciais[0].protocolo
    );
    const [novaMensagem, setNovaMensagem] = useState('');
    const [visivelDenunciante, setVisivelDenunciante] = useState(true);
    const [aviso, setAviso] = useState('');

    const denunciasFiltradas = useMemo(() => {
        if (filtroStatus === 'TODOS') {
            return denuncias;
        }

        return denuncias.filter(
            (denuncia) => denuncia.status === filtroStatus
        );
    }, [denuncias, filtroStatus]);

    const denunciaSelecionada = denuncias.find(
        (denuncia) => denuncia.protocolo === protocoloSelecionado
    );

    function selecionarDenuncia(protocolo) {
        setProtocoloSelecionado(protocolo);
        setAviso('');
        setNovaMensagem('');
    }

    function alterarStatus(novoStatus) {
        if (!denunciaSelecionada || novoStatus === denunciaSelecionada.status) {
            return;
        }

        const horarioAtual = new Date().toISOString();
        const statusAnterior = denunciaSelecionada.status;

        setDenuncias((listaAtual) =>
            listaAtual.map((denuncia) => {
                if (denuncia.protocolo !== protocoloSelecionado) {
                    return denuncia;
                }

                return {
                    ...denuncia,
                    status: novoStatus,
                    historico: [
                        ...denuncia.historico,
                        {
                            id: Date.now(),
                            acao: 'ALTERACAO_STATUS',
                            descricao: `Status alterado de ${
                                nomesStatus[statusAnterior]
                            } para ${nomesStatus[novoStatus]}.`,
                            criadoEm: horarioAtual,
                        },
                    ],
                };
            })
        );

        setAviso('Status atualizado na demonstração visual.');
    }

    function enviarMensagem(evento) {
        evento.preventDefault();

        const conteudo = novaMensagem.trim();

        if (!conteudo) {
            return;
        }

        const horarioAtual = new Date().toISOString();

        setDenuncias((listaAtual) =>
            listaAtual.map((denuncia) => {
                if (denuncia.protocolo !== protocoloSelecionado) {
                    return denuncia;
                }

                return {
                    ...denuncia,
                    mensagens: [
                        ...denuncia.mensagens,
                        {
                            id: Date.now(),
                            autor: 'RESPONSAVEL',
                            conteudo,
                            visivelDenunciante,
                            criadoEm: horarioAtual,
                        },
                    ],
                };
            })
        );

        setNovaMensagem('');
        setAviso(
            visivelDenunciante
                ? 'Mensagem pública registrada na demonstração.'
                : 'Observação interna registrada na demonstração.'
        );
    }

    const totalRisco = denuncias.filter(
        (denuncia) => denuncia.riscoImediato
    ).length;

    const totalPendentes = denuncias.filter((denuncia) =>
        ['RECEBIDO', 'EM_TRIAGEM', 'EM_APURACAO'].includes(denuncia.status)
    ).length;

    return (
        <div className="painel-interno">
            <header className="painel-topo">
                <div>
                    <span className="painel-etiqueta">
                        DEMONSTRAÇÃO LOCAL — DADOS FICTÍCIOS
                    </span>

                    <h1>Painel de tratamento de relatos</h1>

                    <p>
                        Área destinada exclusivamente à equipe responsável pelo
                        Canal de Denúncias.
                    </p>
                </div>

                <a className="botao secundario" href="/">
                    Voltar ao canal público
                </a>
            </header>

            <section className="painel-resumos">
                <Resumo titulo="Total de relatos" valor={denuncias.length} />
                <Resumo titulo="Casos em andamento" valor={totalPendentes} />
                <Resumo
                    titulo="Risco imediato"
                    valor={totalRisco}
                    destaque="risco"
                />
            </section>

            <section className="painel-layout">
                <aside className="lista-denuncias">
                    <div className="lista-topo">
                        <div>
                            <h2>Relatos</h2>
                            <span>{denunciasFiltradas.length} encontrados</span>
                        </div>

                        <select
                            value={filtroStatus}
                            onChange={(evento) =>
                                setFiltroStatus(evento.target.value)
                            }
                            aria-label="Filtrar relatos por status"
                        >
                            <option value="TODOS">Todos os status</option>

                            {statusPermitidos.map((status) => (
                                <option key={status} value={status}>
                                    {nomesStatus[status]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="itens-denuncias">
                        {denunciasFiltradas.map((denuncia) => (
                            <button
                                key={denuncia.protocolo}
                                type="button"
                                className={
                                    denuncia.protocolo === protocoloSelecionado
                                        ? 'item-denuncia selecionado'
                                        : 'item-denuncia'
                                }
                                onClick={() =>
                                    selecionarDenuncia(denuncia.protocolo)
                                }
                            >
                                <div className="item-denuncia-topo">
                                    <strong>{denuncia.protocolo}</strong>

                                    {denuncia.riscoImediato && (
                                        <span className="tag-risco">
                                            Risco imediato
                                        </span>
                                    )}
                                </div>

                                <span>{denuncia.categoria}</span>

                                <div className="item-denuncia-rodape">
                                    <small>
                                        {denuncia.tipoEnvio === 'ANONIMO'
                                            ? 'Anônimo'
                                            : 'Identificado'}
                                    </small>

                                    <Status status={denuncia.status} />
                                </div>
                            </button>
                        ))}

                        {denunciasFiltradas.length === 0 && (
                            <p className="lista-vazia">
                                Nenhum relato encontrado neste filtro.
                            </p>
                        )}
                    </div>
                </aside>

                {denunciaSelecionada && (
                    <main className="detalhe-interno">
                        <div className="detalhe-interno-topo">
                            <div>
                                <span className="texto-discreto">
                                    Protocolo
                                </span>

                                <h2>{denunciaSelecionada.protocolo}</h2>

                                <p>
                                    {denunciaSelecionada.tipoEnvio === 'ANONIMO'
                                        ? 'Relato anônimo'
                                        : 'Relato identificado'}
                                </p>
                            </div>

                            <Status status={denunciaSelecionada.status} />
                        </div>

                        {aviso && (
                            <p className="mensagem sucesso">{aviso}</p>
                        )}

                        {denunciaSelecionada.tipoEnvio === 'IDENTIFICADO' && (
                            <section className="bloco-interno dados-restritos">
                                <div className="bloco-titulo">
                                    <h3>Dados da pessoa relatora</h3>
                                    <span>ACESSO RESTRITO</span>
                                </div>

                                <div className="grade-dados">
                                    <Info
                                        titulo="Nome"
                                        valor={
                                            denunciaSelecionada.denunciante.nome
                                        }
                                    />
                                    <Info
                                        titulo="E-mail"
                                        valor={
                                            denunciaSelecionada.denunciante
                                                .email
                                        }
                                    />
                                    <Info
                                        titulo="Telefone"
                                        valor={
                                            denunciaSelecionada.denunciante
                                                .telefone
                                        }
                                    />
                                </div>
                            </section>
                        )}

                        <section className="bloco-interno">
                            <div className="bloco-titulo">
                                <h3>Andamento do caso</h3>
                            </div>

                            <div className="alterar-status">
                                <label htmlFor="status-denuncia">
                                    Status atual
                                </label>

                                <select
                                    id="status-denuncia"
                                    value={denunciaSelecionada.status}
                                    onChange={(evento) =>
                                        alterarStatus(evento.target.value)
                                    }
                                >
                                    {statusPermitidos.map((status) => (
                                        <option key={status} value={status}>
                                            {nomesStatus[status]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        <section className="bloco-interno">
                            <div className="bloco-titulo">
                                <h3>Informações do relato</h3>

                                {denunciaSelecionada.riscoImediato && (
                                    <span className="tag-risco">
                                        Risco imediato informado
                                    </span>
                                )}
                            </div>

                            <div className="texto-relato">
                                <p>
                                    <strong>Categoria:</strong>{' '}
                                    {denunciaSelecionada.categoria}
                                </p>

                                <p>
                                    <strong>Local:</strong>{' '}
                                    {denunciaSelecionada.localFato}
                                </p>

                                <p>
                                    <strong>Pessoas envolvidas:</strong>{' '}
                                    {denunciaSelecionada.pessoasEnvolvidas}
                                </p>

                                <p>
                                    <strong>Descrição:</strong>
                                    <br />
                                    {denunciaSelecionada.descricao}
                                </p>
                            </div>
                        </section>

                        <section className="bloco-interno">
                            <div className="bloco-titulo">
                                <h3>Mensagens</h3>
                            </div>

                            <div className="lista-mensagens">
                                {denunciaSelecionada.mensagens.length === 0 ? (
                                    <p className="texto-discreto">
                                        Nenhuma mensagem registrada.
                                    </p>
                                ) : (
                                    denunciaSelecionada.mensagens.map(
                                        (mensagem) => (
                                            <article
                                                key={mensagem.id}
                                                className={
                                                    mensagem.visivelDenunciante
                                                        ? 'mensagem responsavel'
                                                        : 'mensagem interna'
                                                }
                                            >
                                                <div className="mensagem-meta">
                                                    <strong>
                                                        {mensagem.autor ===
                                                        'DENUNCIANTE'
                                                            ? 'Pessoa relatora'
                                                            : mensagem.visivelDenunciante
                                                              ? 'Responsável — visível à pessoa relatora'
                                                              : 'Responsável — nota interna'}
                                                    </strong>

                                                    <time>
                                                        {formatarDataHora(
                                                            mensagem.criadoEm
                                                        )}
                                                    </time>
                                                </div>

                                                <p>{mensagem.conteudo}</p>
                                            </article>
                                        )
                                    )
                                )}
                            </div>

                            <form
                                className="formulario-mensagem"
                                onSubmit={enviarMensagem}
                            >
                                <h3>Registrar mensagem</h3>

                                <textarea
                                    value={novaMensagem}
                                    onChange={(evento) =>
                                        setNovaMensagem(evento.target.value)
                                    }
                                    maxLength="5000"
                                    rows="5"
                                    placeholder="Escreva uma mensagem ou observação sobre o caso."
                                    required
                                />

                                <label className="checkbox-linha">
                                    <input
                                        type="checkbox"
                                        checked={visivelDenunciante}
                                        onChange={(evento) =>
                                            setVisivelDenunciante(
                                                evento.target.checked
                                            )
                                        }
                                    />

                                    <span>
                                        Esta mensagem será visível para a pessoa
                                        relatora no acompanhamento do caso.
                                    </span>
                                </label>

                                <button className="botao primario" type="submit">
                                    Registrar mensagem
                                </button>
                            </form>
                        </section>

                        <section className="bloco-interno">
                            <div className="bloco-titulo">
                                <h3>Histórico</h3>
                            </div>

                            <ol className="historico">
                                {denunciaSelecionada.historico.map((item) => (
                                    <li key={item.id}>
                                        <strong>{item.acao}</strong>
                                        <span>{item.descricao}</span>
                                        <time>
                                            {formatarDataHora(item.criadoEm)}
                                        </time>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </main>
                )}
            </section>
        </div>
    );
}

function Resumo({ titulo, valor, destaque = '' }) {
    return (
        <article className={`resumo-painel ${destaque}`}>
            <span>{titulo}</span>
            <strong>{valor}</strong>
        </article>
    );
}

function Info({ titulo, valor }) {
    return (
        <div>
            <span>{titulo}</span>
            <strong>{valor}</strong>
        </div>
    );
}

function Status({ status }) {
    return (
        <span className={`status status-${status.toLowerCase()}`}>
            {nomesStatus[status]}
        </span>
    );
}

function formatarDataHora(valor) {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(valor));
}

export default PainelInternoDemo;