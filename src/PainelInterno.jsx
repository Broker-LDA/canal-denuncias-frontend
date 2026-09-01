import { useEffect, useMemo, useState } from 'react';

function obterToken() {
    return localStorage.getItem('tokenIntranet');
}

const STATUS_PERMITIDOS = [
    'RECEBIDO',
    'EM_TRIAGEM',
    'EM_APURACAO',
    'AGUARDANDO_INFORMACOES',
    'CONCLUIDO',
    'ARQUIVADO',
];

const NOMES_STATUS = {
    RECEBIDO: 'Recebido',
    EM_TRIAGEM: 'Em triagem',
    EM_APURACAO: 'Em apuração',
    AGUARDANDO_INFORMACOES: 'Aguardando informações',
    CONCLUIDO: 'Concluído',
    ARQUIVADO: 'Arquivado',
};

// Somente simulação local até existir autenticação real da intranet.
const USUARIO_INTERNO_TESTE_ID = Number(
    import.meta.env.VITE_USUARIO_INTERNO_TESTE_ID || 1
);

async function lerResposta(resposta) {
    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error(
            dados?.mensagem ||
                'Não foi possível concluir a operação.'
        );
    }

    return dados;
}

function PainelInterno() {
    const [denuncias, setDenuncias] = useState([]);
    const [filtroStatus, setFiltroStatus] = useState('');
    const [protocoloSelecionado, setProtocoloSelecionado] =
        useState('');

    const [detalhe, setDetalhe] = useState(null);

    const [carregandoLista, setCarregandoLista] =
        useState(true);

    const [carregandoDetalhe, setCarregandoDetalhe] =
        useState(false);

    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    const [novoStatus, setNovoStatus] = useState('');
    const [detalhesStatus, setDetalhesStatus] = useState('');

    const [conteudoMensagem, setConteudoMensagem] =
        useState('');

    const [visivelDenunciante, setVisivelDenunciante] =
        useState(true);

    const [salvandoStatus, setSalvandoStatus] =
        useState(false);

    const [enviandoMensagem, setEnviandoMensagem] =
        useState(false);

    async function carregarLista(status = filtroStatus) {
        setCarregandoLista(true);
        setErro('');

        try {
            const query = status
                ? `?status=${encodeURIComponent(status)}`
                : '';

           const resposta = await fetch(`https://lda_intranet_backend.eyg4rz.easypanel.host/api/intranet-denuncias${query}`, {
                headers: {
                    'Authorization': `Bearer ${obterToken()}`
                }
            });

            const dados = await lerResposta(resposta);

            setDenuncias(dados.denuncias);

            if (
                protocoloSelecionado &&
                !dados.denuncias.some(
                    (denuncia) =>
                        denuncia.protocolo ===
                        protocoloSelecionado
                )
            ) {
                setProtocoloSelecionado('');
                setDetalhe(null);
            }
        } catch (erroLista) {
            setErro(erroLista.message);
        } finally {
            setCarregandoLista(false);
        }
    }

    async function carregarDetalhe(protocolo) {
        setCarregandoDetalhe(true);
        setErro('');
        setAviso('');

        try {
            // Adicionei a barra / antes do protocolo aqui também!
            const resposta = await fetch(`https://lda_intranet_backend.eyg4rz.easypanel.host/api/intranet-denuncias/${encodeURIComponent(protocolo)}`, {
                headers: {
                    'Authorization': `Bearer ${obterToken()}`
                }
            });

            const dados = await lerResposta(resposta);

            setDetalhe(dados);
            setNovoStatus(dados.denuncia.status);
        } catch (erroDetalhe) {
            setErro(erroDetalhe.message);
            setDetalhe(null);
        } finally {
            setCarregandoDetalhe(false);
        }
    }

    useEffect(() => {
        carregarLista();
        // Carrega somente uma vez na abertura.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function selecionarDenuncia(protocolo) {
        setProtocoloSelecionado(protocolo);
        await carregarDetalhe(protocolo);
    }

    async function filtrarPorStatus(evento) {
        const status = evento.target.value;

        setFiltroStatus(status);
        setProtocoloSelecionado('');
        setDetalhe(null);

        await carregarLista(status);
    }

    async function atualizarStatus(evento) {
        evento.preventDefault();

        if (!detalhe || novoStatus === detalhe.denuncia.status) {
            setAviso('Selecione um status diferente do atual.');
            return;
        }

        setSalvandoStatus(true);
        setErro('');
        setAviso('');

        try {
            const resposta = await fetch(`https://lda_intranet_backend.eyg4rz.easypanel.host/api/intranet-denuncias/${encodeURIComponent(detalhe.denuncia.protocolo)}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${obterToken()}`
                },
                body: JSON.stringify({
                    status: novoStatus,
                    detalhes: detalhesStatus
                }),
            });

            const dados = await lerResposta(resposta);

            setDetalhesStatus('');
            setAviso(dados.mensagem);

            await carregarLista();
            await carregarDetalhe(
                detalhe.denuncia.protocolo
            );
        } catch (erroStatus) {
            setErro(erroStatus.message);
        } finally {
            setSalvandoStatus(false);
        }
    }

    async function enviarMensagem(evento) {
        evento.preventDefault();

        if (!detalhe) {
            return;
        }

        const mensagemLimpa = conteudoMensagem.trim();

        if (!mensagemLimpa) {
            setErro('Escreva uma mensagem antes de registrar.');
            return;
        }

        setEnviandoMensagem(true);
        setErro('');
        setAviso('');

        try {
           const resposta = await fetch(`https://lda_intranet_backend.eyg4rz.easypanel.host/api/intranet-denuncias/${encodeURIComponent(detalhe.denuncia.protocolo)}/mensagens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${obterToken()}`
                },
                body: JSON.stringify({
                    conteudo: mensagemLimpa,
                    visivelDenunciante: visivelDenunciante === true
                }),
            });

            const dados = await lerResposta(resposta);

            setConteudoMensagem('');
            setAviso(dados.mensagem);

            await carregarLista();
            await carregarDetalhe(
                detalhe.denuncia.protocolo
            );
        } catch (erroMensagem) {
            setErro(erroMensagem.message);
        } finally {
            setEnviandoMensagem(false);
        }
    }

    const totalRisco = useMemo(
        () =>
            denuncias.filter(
                (denuncia) => denuncia.riscoImediato
            ).length,
        [denuncias]
    );

    const totalEmAndamento = useMemo(
        () =>
            denuncias.filter((denuncia) =>
                [
                    'RECEBIDO',
                    'EM_TRIAGEM',
                    'EM_APURACAO',
                    'AGUARDANDO_INFORMACOES',
                ].includes(denuncia.status)
            ).length,
        [denuncias]
    );

    const relatoEncerrado = [
        'CONCLUIDO',
        'ARQUIVADO',
    ].includes(detalhe?.denuncia?.status);

    return (
        <div className="painel-interno">
            <header className="painel-topo">
                <div>
                    <span className="painel-etiqueta">
                        AMBIENTE LOCAL DE TESTES
                    </span>

                    <h1>Painel de tratamento de relatos</h1>

                    <p>
                        Área restrita para análise e tratamento dos
                        relatos recebidos.
                    </p>
                </div>

                <a className="botao secundario" href="/">
                    Voltar ao canal público
                </a>
            </header>

            <section className="painel-resumos">
                <Resumo
                    titulo="Relatos carregados"
                    valor={denuncias.length}
                />

                <Resumo
                    titulo="Em andamento"
                    valor={totalEmAndamento}
                />

                <Resumo
                    titulo="Risco imediato"
                    valor={totalRisco}
                    destaque="risco"
                />
            </section>

            {erro && (
                <p className="mensagem erro">{erro}</p>
            )}

            {aviso && (
                <p className="mensagem sucesso">{aviso}</p>
            )}

            <section className="painel-layout">
                <aside className="lista-denuncias">
                    <div className="lista-topo">
                        <div>
                            <h2>Relatos</h2>
                            <span>
                                {carregandoLista
                                    ? 'Carregando...'
                                    : `${denuncias.length} encontrados`}
                            </span>
                        </div>

                        <select
                            value={filtroStatus}
                            onChange={filtrarPorStatus}
                            aria-label="Filtrar relatos por status"
                        >
                            <option value="">
                                Todos os status
                            </option>

                            {STATUS_PERMITIDOS.map((status) => (
                                <option key={status} value={status}>
                                    {NOMES_STATUS[status]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="itens-denuncias">
                        {denuncias.map((denuncia) => (
                            <button
                                key={denuncia.protocolo}
                                type="button"
                                className={
                                    denuncia.protocolo ===
                                    protocoloSelecionado
                                        ? 'item-denuncia selecionado'
                                        : 'item-denuncia'
                                }
                                onClick={() =>
                                    selecionarDenuncia(
                                        denuncia.protocolo
                                    )
                                }
                            >
                                <div className="item-denuncia-topo">
                                    <strong>
                                        {denuncia.protocolo}
                                    </strong>

                                    {denuncia.riscoImediato && (
                                        <span className="tag-risco">
                                            Risco imediato
                                        </span>
                                    )}
                                </div>

                                <span>{denuncia.categoria}</span>

                                <div className="item-denuncia-rodape">
                                    <small>
                                        {denuncia.tipoEnvio ===
                                        'ANONIMO'
                                            ? 'Anônimo'
                                            : 'Identificado'}
                                    </small>

                                    <Status status={denuncia.status} />
                                </div>
                            </button>
                        ))}

                        {!carregandoLista &&
                            denuncias.length === 0 && (
                                <p className="lista-vazia">
                                    Nenhum relato encontrado.
                                </p>
                            )}
                    </div>
                </aside>

                <main className="detalhe-interno">
                    {!protocoloSelecionado && (
                        <p className="texto-discreto">
                            Selecione um relato para visualizar os
                            detalhes.
                        </p>
                    )}

                    {carregandoDetalhe && (
                        <p className="texto-discreto">
                            Carregando detalhes...
                        </p>
                    )}

                    {detalhe && !carregandoDetalhe && (
                        <>
                            <div className="detalhe-interno-topo">
                                <div>
                                    <span className="texto-discreto">
                                        Protocolo
                                    </span>

                                    <h2>
                                        {detalhe.denuncia.protocolo}
                                    </h2>

                                    <p>
                                        {detalhe.denuncia.tipoEnvio ===
                                        'ANONIMO'
                                            ? 'Relato anônimo'
                                            : 'Relato identificado'}
                                    </p>
                                </div>

                                <Status
                                    status={detalhe.denuncia.status}
                                />
                            </div>

                            {detalhe.denunciante && (
                                <section className="bloco-interno dados-restritos">
                                    <div className="bloco-titulo">
                                        <h3>
                                            Dados da pessoa relatora
                                        </h3>

                                        <span>ACESSO RESTRITO</span>
                                    </div>

                                    <div className="grade-dados">
                                        <Info
                                            titulo="Nome"
                                            valor={
                                                detalhe.denunciante.nome
                                            }
                                        />
                                        <Info
                                            titulo="E-mail"
                                            valor={
                                                detalhe.denunciante.email
                                            }
                                        />
                                        <Info
                                            titulo="Telefone"
                                            valor={
                                                detalhe.denunciante.telefone
                                            }
                                        />
                                        <Info
                                            titulo="Cargo ou vínculo"
                                            valor={
                                                detalhe.denunciante
                                                    .cargoOuVinculo
                                            }
                                        />
                                    </div>
                                </section>
                            )}

                            <section className="bloco-interno">
                                <div className="bloco-titulo">
                                    <h3>Andamento do caso</h3>
                                </div>

                                <form
                                    className="formulario-status"
                                    onSubmit={atualizarStatus}
                                >
                                    <label className="campo">
                                        <span>Novo status</span>

                                        <select
                                            value={novoStatus}
                                            onChange={(evento) =>
                                                setNovoStatus(
                                                    evento.target.value
                                                )
                                            }
                                        >
                                            {STATUS_PERMITIDOS.map(
                                                (status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {NOMES_STATUS[status]}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className="campo">
                                        <span>
                                            Justificativa interna
                                            (opcional)
                                        </span>

                                        <input
                                            value={detalhesStatus}
                                            maxLength="1000"
                                            onChange={(evento) =>
                                                setDetalhesStatus(
                                                    evento.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <button
                                        className="botao primario"
                                        type="submit"
                                        disabled={salvandoStatus}
                                    >
                                        {salvandoStatus
                                            ? 'Atualizando...'
                                            : 'Atualizar status'}
                                    </button>
                                </form>
                            </section>

                            <section className="bloco-interno">
                                <div className="bloco-titulo">
                                    <h3>Informações do relato</h3>

                                    {detalhe.denuncia.riscoImediato && (
                                        <span className="tag-risco">
                                            Risco imediato informado
                                        </span>
                                    )}
                                </div>

                                <div className="texto-relato">
                                    <p>
                                        <strong>Categoria:</strong>{' '}
                                        {detalhe.denuncia.categoria}
                                    </p>

                                    <p>
                                        <strong>Local:</strong>{' '}
                                        {detalhe.denuncia.localFato ||
                                            'Não informado'}
                                    </p>

                                    <p>
                                        <strong>
                                            Pessoas envolvidas:
                                        </strong>{' '}
                                        {
                                            detalhe.denuncia
                                                .pessoasEnvolvidas
                                        }
                                    </p>

                                    {detalhe.denuncia.testemunhas && (
                                        <p>
                                            <strong>Testemunhas:</strong>{' '}
                                            {
                                                detalhe.denuncia
                                                    .testemunhas
                                            }
                                        </p>
                                    )}

                                    {detalhe.denuncia.dataFato && (
                                        <p>
                                            <strong>Data do fato:</strong>{' '}
                                            {formatarData(
                                                detalhe.denuncia.dataFato
                                            )}
                                        </p>
                                    )}

                                    {detalhe.denuncia.periodoFato && (
                                        <p>
                                            <strong>Período:</strong>{' '}
                                            {
                                                detalhe.denuncia
                                                    .periodoFato
                                            }
                                        </p>
                                    )}

                                    <p>
                                        <strong>Descrição:</strong>
                                        <br />
                                        {detalhe.denuncia.descricao}
                                    </p>

                                    {detalhe.denuncia.sentimento && (
                                        <p className="sentimento-relato">
                                            <strong>Como a pessoa se sente:</strong>
                                            <br />
                                            {detalhe.denuncia.sentimento}
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section className="bloco-interno">
                                <div className="bloco-titulo">
                                    <h3>Evidências anexadas</h3>
                                </div>

                                {detalhe.anexos?.length ? (
                                    <ul className="lista-anexos">
                                        {detalhe.anexos.map((anexo) => (
                                            <li key={anexo.id}>
                                                <span>
                                                    {anexo.nomeOriginal} —{' '}
                                                    {formatarTamanho(
                                                        anexo.tamanhoBytes
                                                    )}
                                                </span>

                                                <a
                                                    className="botao-link"
                                                    href={`/api/interno/denuncias/${encodeURIComponent(
                                                        detalhe.denuncia
                                                            .protocolo
                                                    )}/anexos/${
                                                        anexo.id
                                                    }/download`}
                                                >
                                                    Baixar
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="texto-discreto">
                                        Nenhuma evidência foi anexada.
                                    </p>
                                )}
                            </section>

                            <section className="bloco-interno">
                                <div className="bloco-titulo">
                                    <h3>Mensagens</h3>
                                </div>

                                <div className="lista-mensagens">
                                    {detalhe.mensagens.length === 0 ? (
                                        <p className="texto-discreto">
                                            Nenhuma mensagem registrada.
                                        </p>
                                    ) : (
                                        detalhe.mensagens.map(
                                            (mensagem) => (
                                                <article
                                                    key={mensagem.id}
                                                    className={
                                                        mensagem.tipoAutor ===
                                                        'RESPONSAVEL'
                                                            ? mensagem.visivelDenunciante
                                                                ? 'mensagem responsavel'
                                                                : 'mensagem interna'
                                                            : 'mensagem denunciante'
                                                    }
                                                >
                                                    <div className="mensagem-meta">
                                                        <strong>
                                                            {mensagem.tipoAutor ===
                                                            'RESPONSAVEL'
                                                                ? mensagem.visivelDenunciante
                                                                    ? 'Equipe responsável · pública'
                                                                    : 'Equipe responsável · interna'
                                                                : 'Pessoa relatora'}
                                                        </strong>

                                                        <time>
                                                            {formatarDataHora(
                                                                mensagem.criadoEm
                                                            )}
                                                        </time>
                                                    </div>

                                                    <p>
                                                        {mensagem.conteudo}
                                                    </p>
                                                </article>
                                            )
                                        )
                                    )}
                                </div>

                                {!relatoEncerrado ? (
                                    <form
                                        className="formulario-mensagem"
                                        onSubmit={enviarMensagem}
                                    >
                                        <h3>Registrar mensagem</h3>

                                        <textarea
                                            value={conteudoMensagem}
                                            onChange={(evento) =>
                                                setConteudoMensagem(
                                                    evento.target.value
                                                )
                                            }
                                            maxLength="5000"
                                            rows="5"
                                            required
                                            placeholder="Escreva uma mensagem para a pessoa relatora ou uma observação interna."
                                        />

                                        <label className="checkbox-linha">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    visivelDenunciante
                                                }
                                                onChange={(evento) =>
                                                    setVisivelDenunciante(
                                                        evento.target.checked
                                                    )
                                                }
                                            />

                                            <span>
                                                Tornar a mensagem visível
                                                para a pessoa relatora
                                            </span>
                                        </label>

                                        <button
                                            className="botao primario"
                                            type="submit"
                                            disabled={enviandoMensagem}
                                        >
                                            {enviandoMensagem
                                                ? 'Registrando...'
                                                : visivelDenunciante
                                                ? 'Enviar mensagem pública'
                                                : 'Registrar observação interna'}
                                        </button>
                                    </form>
                                ) : (
                                    <p className="mensagem aviso">
                                        Este relato foi encerrado e não
                                        aceita novas mensagens.
                                    </p>
                                )}
                            </section>

                            <section className="bloco-interno">
                                <div className="bloco-titulo">
                                    <h3>Histórico</h3>
                                </div>

                                {detalhe.historico.length === 0 ? (
                                    <p className="texto-discreto">
                                        Nenhuma movimentação registrada.
                                    </p>
                                ) : (
                                    <ol className="historico">
                                        {detalhe.historico.map((item) => (
                                            <li key={item.id}>
                                                <strong>{item.acao}</strong>

                                                <span>
                                                    {item.detalhes ||
                                                        `${item.statusAnterior || ''} → ${
                                                            item.statusNovo || ''
                                                        }`}
                                                </span>

                                                <time>
                                                    {formatarDataHora(
                                                        item.criadoEm
                                                    )}
                                                </time>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </section>
                        </>
                    )}
                </main>
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
            <strong>{valor || 'Não informado'}</strong>
        </div>
    );
}

function Status({ status }) {
    return (
        <span className={`status status-${status?.toLowerCase()}`}>
            {NOMES_STATUS[status] || status}
        </span>
    );
}

function formatarData(valor) {
    if (!valor) {
        return 'Não informada';
    }

    const [ano, mes, dia] = String(valor)
        .slice(0, 10)
        .split('-');

    return dia && mes && ano
        ? `${dia}/${mes}/${ano}`
        : valor;
}

function formatarDataHora(valor) {
    if (!valor) {
        return 'Não informado';
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(valor));
}

function formatarTamanho(bytes) {
    if (!Number.isFinite(Number(bytes))) {
        return 'Tamanho não informado';
    }

    return `${(Number(bytes) / 1024 / 1024).toFixed(2)} MB`;
}

export default PainelInterno;
