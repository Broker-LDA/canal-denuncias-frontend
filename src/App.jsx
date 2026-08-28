import { useRef, useState } from 'react';
import logoLDA from '../src/assets/logo-lda-etica.png';

const API_URL = import.meta.env.VITE_API_URL || 'https://lda-canal-denuncia.eyg4rz.easypanel.host';

const dadosIniciaisFormulario = {
    tipoEnvio: 'ANONIMO',
    categoria: '',
    outraCategoria: '',
    pessoasEnvolvidas: '',
    testemunhas: '',
    descricao: '',
    sentimento: '',
    dataFato: '',
    periodoFato: '',
    localFato: '',
    riscoImediato: false,
    nome: '',
    email: '',
    telefone: '',
    cargoOuVinculo: '',
};

function App() {
    const [abaAtiva, setAbaAtiva] = useState('novo-relato');

    const [formulario, setFormulario] = useState(
        dadosIniciaisFormulario
    );

    const [anexos, setAnexos] = useState([]);
    const inputAnexosRef = useRef(null);

    const [enviandoRelato, setEnviandoRelato] = useState(false);
    const [erroRelato, setErroRelato] = useState('');
    const [resultadoRelato, setResultadoRelato] = useState(null);

    const [protocoloConsulta, setProtocoloConsulta] = useState('');
    const [codigoAcessoConsulta, setCodigoAcessoConsulta] = useState('');
    const [consultando, setConsultando] = useState(false);
    const [erroConsulta, setErroConsulta] = useState('');
    const [denunciaConsultada, setDenunciaConsultada] = useState(null);

    const [novaMensagem, setNovaMensagem] = useState('');
    const [enviandoMensagem, setEnviandoMensagem] = useState(false);
    const [erroMensagem, setErroMensagem] = useState('');
    const [sucessoMensagem, setSucessoMensagem] = useState('');

    function atualizarFormulario(evento) {
        const { name, value, type, checked } = evento.target;

        setFormulario((dadosAtuais) => {
            const novoValor = type === 'checkbox' ? checked : value;

            const novosDados = {
                ...dadosAtuais,
                [name]: novoValor,
            };

            // Ao voltar para o relato anônimo, remove dados pessoais
            // que possam ter sido preenchidos anteriormente.
            if (name === 'tipoEnvio' && value === 'ANONIMO') {
                novosDados.nome = '';
                novosDados.email = '';
                novosDados.telefone = '';
                novosDados.cargoOuVinculo = '';
            }

            return novosDados;
        });
    }

    async function lerResposta(resposta) {
        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(
                dados?.mensagem ||
                    'Não foi possível concluir a operação neste momento.'
            );
        }

        return dados;
    }

    function validarAnexosSelecionados(arquivos) {
    const TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024;
    const TAMANHO_MAXIMO_TOTAL = 20 * 1024 * 1024;

    const tiposPermitidos = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'video/mp4',
        'video/webm',
    ];

    if (arquivos.length > 3) {
        return 'Envie no máximo 3 anexos.';
    }

    const possuiTipoInvalido = arquivos.some(
        (arquivo) => !tiposPermitidos.includes(arquivo.type)
    );

    if (possuiTipoInvalido) {
        return (
            'Envie apenas imagens JPG, PNG ou WEBP, arquivos PDF e vídeos MP4 ou WEBM.'
        );
    }

    const possuiArquivoGrande = arquivos.some(
        (arquivo) => arquivo.size > TAMANHO_MAXIMO_ARQUIVO
    );

    if (possuiArquivoGrande) {
        return 'Cada anexo pode possuir no máximo 10 MB.';
    }

    const tamanhoTotal = arquivos.reduce(
        (total, arquivo) => total + arquivo.size,
        0
    );

    if (tamanhoTotal > TAMANHO_MAXIMO_TOTAL) {
        return 'O tamanho total dos anexos não pode ultrapassar 20 MB.';
    }

    return '';
}

    function selecionarAnexos(evento) {
        const arquivosSelecionados = Array.from(
            evento.target.files || []
        );

        const erro = validarAnexosSelecionados(arquivosSelecionados);

        if (erro) {
            setAnexos([]);
            setErroRelato(erro);
            evento.target.value = '';
            return;
        }

        setErroRelato('');
        setAnexos(arquivosSelecionados);
    }

    function removerAnexo(indiceParaRemover) {
        setAnexos((listaAtual) =>
            listaAtual.filter(
                (_, indice) => indice !== indiceParaRemover
            )
        );
    }

    async function enviarRelato(evento) {
        evento.preventDefault();

        const emailInformado = formulario.email.trim();
        const telefoneInformado = formulario.telefone.trim();
        const dataFatoInformada = formulario.dataFato.trim();
        const periodoFatoInformado = formulario.periodoFato.trim();

        if (!dataFatoInformada && !periodoFatoInformado) {
            setErroRelato(
                'Informe a data do fato ou um período aproximado em que ocorreu.'
            );

            return;
        }

        if (
            formulario.tipoEnvio === 'IDENTIFICADO' &&
            !emailInformado &&
            !telefoneInformado
        ) {
            setErroRelato(
                'Para um relato identificado, informe ao menos um e-mail ou telefone.'
            );

            return;
        }

        setEnviandoRelato(true);
        setErroRelato('');
        setResultadoRelato(null);

        try {

            const categoriaFinal =
                formulario.categoria === 'Outro'
                    ? formulario.outraCategoria
                    : formulario.categoria;

            const dadosFormulario = new FormData();

            dadosFormulario.append('tipoEnvio', formulario.tipoEnvio);
            dadosFormulario.append('categoria', categoriaFinal);
            dadosFormulario.append(
                'pessoasEnvolvidas',
                formulario.pessoasEnvolvidas
            );
            dadosFormulario.append('testemunhas', formulario.testemunhas);
            dadosFormulario.append('descricao', formulario.descricao);
            dadosFormulario.append('sentimento', formulario.sentimento);
            dadosFormulario.append('dataFato', formulario.dataFato);
            dadosFormulario.append('periodoFato', formulario.periodoFato);
            dadosFormulario.append('localFato', formulario.localFato);
            dadosFormulario.append(
                'riscoImediato',
                String(formulario.riscoImediato)
            );
            dadosFormulario.append('nome', formulario.nome);
            dadosFormulario.append('email', formulario.email);
            dadosFormulario.append('telefone', formulario.telefone);
            dadosFormulario.append(
                'cargoOuVinculo',
                formulario.cargoOuVinculo
            );

            for (const anexo of anexos) {
                dadosFormulario.append('anexos', anexo);
            }

            const resposta = await fetch(
                `${API_URL}/api/canal/denuncias`,
                {
                    method: 'POST',
                    body: dadosFormulario,
                }
            );

            const dados = await lerResposta(resposta);

            setResultadoRelato(dados);
            setFormulario(dadosIniciaisFormulario);
            setAnexos([]);

            if (inputAnexosRef.current) {
                inputAnexosRef.current.value = '';
            }
        } catch (erro) {
            setErroRelato(erro.message);
        } finally {
            setEnviandoRelato(false);
        }
    }

    async function carregarAcompanhamento() {
        const resposta = await fetch(
            `${API_URL}/api/canal/denuncias/acompanhar`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    protocolo: protocoloConsulta,
                    codigoAcesso: codigoAcessoConsulta,
                }),
            }
        );

        const dados = await lerResposta(resposta);

        setDenunciaConsultada(dados);

        return dados;
    }

    async function acompanharRelato(evento) {
    evento.preventDefault();

    setConsultando(true);
    setErroConsulta('');
    setErroMensagem('');
    setSucessoMensagem('');
    setDenunciaConsultada(null);

    try {
        await carregarAcompanhamento();
    } catch (erro) {
        setErroConsulta(erro.message);
    } finally {
        setConsultando(false);
    }
}

    async function enviarMensagemComplementar(evento) {
        evento.preventDefault();

        setEnviandoMensagem(true);
        setErroMensagem('');
        setSucessoMensagem('');

        try {
            const resposta = await fetch(
                `${API_URL}/api/canal/denuncias/acompanhar/mensagens`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        protocolo: protocoloConsulta,
                        codigoAcesso: codigoAcessoConsulta,
                        conteudo: novaMensagem,
                    }),
                }
            );

            const dados = await lerResposta(resposta);

            setNovaMensagem('');
            setSucessoMensagem(dados.mensagem);

            // Atualiza a lista sem limpar a mensagem de sucesso.
            await carregarAcompanhamento();
        } catch (erro) {
            setErroMensagem(erro.message);
        } finally {
            setEnviandoMensagem(false);
        }
    }

    function irParaAcompanhamento() {
        if (resultadoRelato?.denuncia?.protocolo) {
            setProtocoloConsulta(resultadoRelato.denuncia.protocolo);
        }

        if (resultadoRelato?.denuncia?.codigoAcesso) {
            setCodigoAcessoConsulta(resultadoRelato.denuncia.codigoAcesso);
        }

        setAbaAtiva('acompanhar');
    }

    const relatoEncerrado = ['CONCLUIDO', 'ARQUIVADO'].includes(
        denunciaConsultada?.denuncia?.status
    );

    return (
        <div className="aplicacao">
            <header className="cabecalho">
                <div className="container cabecalho-conteudo">
                    <a className="marca" href="#inicio">
                        <img src={logoLDA} alt="Logotipo da L.D.A (Laços, Diálogo e Atenção)" className="marca-logo"/>
                        <span>
                            <strong>LDA - Laços, Diálogo e Atenção</strong>
                            <small>Canal de Ética e Denúncia</small>
                        </span>
                    </a>

                    <span className="selo-seguranca">
                        Canal protegido
                    </span>
                </div>
            </header>

            <main id="inicio" className="container conteudo-principal">
                <section className="hero">
                    <span className="etiqueta">LDA - Laços, Diálogo e Atenção</span>

                    <h1>
                        Canal de Ética
                        <br />e Denúncias
                    </h1>

                    <p>
                        Este é um espaço seguro para você ser ouvido.
                    </p>

                    <p>
                        O canal é gerido pelo setor de Gente & Gestão da LDA e está
                        aberto para relatos realizados de boa-fé, com respeito,
                        responsabilidade e sem retaliação.
                    </p>

                    <p className="hero-texto-menor">
                        Sua voz ajuda a construir um ambiente mais ético, seguro,
                        respeitoso e saudável para todos.
                    </p>
                </section>

                <section className="cartao painel-principal">
                    <div
                        className="abas"
                        role="tablist"
                        aria-label="Opções do canal de denúncias"
                    >
                        <button
                            type="button"
                            className={abaAtiva === 'novo-relato' ? 'aba ativa' : 'aba'}
                            onClick={() => setAbaAtiva('novo-relato')}
                        >
                            Registrar relato
                        </button>

                        <button
                            type="button"
                            className={abaAtiva === 'acompanhar' ? 'aba ativa' : 'aba'}
                            onClick={() => setAbaAtiva('acompanhar')}
                        >
                            Acompanhar relato
                        </button>
                    </div>

                    {abaAtiva === 'novo-relato' && (
                        <section className="area-formulario">
                            {resultadoRelato ? (
                                <ResultadoRelato
                                    resultado={resultadoRelato}
                                    aoCriarOutro={() => {
                                        setResultadoRelato(null);
                                    }}
                                    aoAcompanhar={irParaAcompanhamento}
                                />
                            ) : (
                                <form onSubmit={enviarRelato} encType="multipart/form-data">
                                    <div className="titulo-secao">
                                        <h2>Registrar um relato</h2>
                                        <p>
                                            Preencha as informações com o
                                            máximo de detalhes possível.
                                        </p>
                                    </div>

                                    <div className="aviso destaque-anonimo">
                                        <strong>Privacidade em primeiro lugar</strong>
                                        <span>
                                            Em relatos anônimos, não solicitamos
                                            nome, login ou dados da intranet.
                                        </span>
                                    </div>

                                    <fieldset className="grupo-campos">
                                        <legend>Como deseja enviar?</legend>

                                        <div className="opcoes-tipo-envio">
                                            <label
                                                className={
                                                    formulario.tipoEnvio ===
                                                    'ANONIMO'
                                                        ? 'opcao-envio selecionada'
                                                        : 'opcao-envio'
                                                }
                                            >
                                                <input
                                                    type="radio"
                                                    name="tipoEnvio"
                                                    value="ANONIMO"
                                                    checked={
                                                        formulario.tipoEnvio ===
                                                        'ANONIMO'
                                                    }
                                                    onChange={
                                                        atualizarFormulario
                                                    }
                                                />

                                                <span>
                                                    <strong>
                                                        Relato anônimo
                                                    </strong>
                                                    <small>
                                                        Você receberá protocolo
                                                        e código secreto para
                                                        acompanhar.
                                                    </small>
                                                </span>
                                            </label>

                                            <label
                                                className={
                                                    formulario.tipoEnvio ===
                                                    'IDENTIFICADO'
                                                        ? 'opcao-envio selecionada'
                                                        : 'opcao-envio'
                                                }
                                            >
                                                <input
                                                    type="radio"
                                                    name="tipoEnvio"
                                                    value="IDENTIFICADO"
                                                    checked={
                                                        formulario.tipoEnvio ===
                                                        'IDENTIFICADO'
                                                    }
                                                    onChange={
                                                        atualizarFormulario
                                                    }
                                                />

                                                <span>
                                                    <strong>
                                                        Relato identificado
                                                    </strong>
                                                    <small>
                                                        Seus dados serão usados
                                                        somente para contato
                                                        sobre este relato.
                                                        O acompanhamento será
                                                        realizado pela equipe
                                                        responsável.
                                                    </small>
                                                </span>
                                            </label>
                                        </div>
                                    </fieldset>

                                    <div className="grade-campos">
                                        <Campo label="Tipo de ocorrência" obrigatorio>
                                            <select
                                                name="categoria"
                                                value={formulario.categoria}
                                                onChange={atualizarFormulario}
                                                required
                                            >
                                                <option value="">Selecione uma opção</option>
                                                <option value="Assédio moral">Assédio moral</option>
                                                <option value="Assédio sexual">Assédio sexual</option>
                                                <option value="Discriminação">
                                                    Discriminação — raça, gênero, religião etc.
                                                </option>
                                                <option value="Descumprimento de normas de segurança">
                                                    Descumprimento de normas de segurança
                                                </option>
                                                <option value="Fraude ou irregularidade">
                                                    Fraude ou irregularidade
                                                </option>
                                                <option value="Conflito de interesses">
                                                    Conflito de interesses
                                                </option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </Campo>

                                        {formulario.categoria === 'Outro' && (
                                            <Campo
                                                label="Descreva o tipo de ocorrência"
                                                obrigatorio
                                                classe="campo-largo"
                                            >
                                                <input
                                                    name="outraCategoria"
                                                    value={formulario.outraCategoria}
                                                    onChange={atualizarFormulario}
                                                    minLength="3"
                                                    maxLength="100"
                                                    placeholder="Informe o tipo de ocorrência"
                                                    required
                                                />
                                            </Campo>
                                        )}

                                        <Campo label="Local do fato">
                                            <input
                                                name="localFato"
                                                value={formulario.localFato}
                                                onChange={atualizarFormulario}
                                                maxLength="255"
                                                placeholder="Ex.: Unidade central"
                                            />
                                        </Campo>

                                        <Campo
                                            label="Pessoa(s) envolvida(s)"
                                            obrigatorio
                                            classe="campo-largo"
                                        >
                                            <input
                                                name="pessoasEnvolvidas"
                                                value={
                                                    formulario.pessoasEnvolvidas
                                                }
                                                onChange={atualizarFormulario}
                                                minLength="5"
                                                maxLength="500"
                                                placeholder="Nome, função, setor ou informações que ajudem a identificar a pessoa."
                                                required
                                            />
                                        </Campo>

                                        <Campo
                                            label="Data aproximada do fato"
                                            classe="campo-metade"
                                        >
                                            <input
                                                type="date"
                                                name="dataFato"
                                                value={formulario.dataFato}
                                                onChange={atualizarFormulario}
                                            />
                                        </Campo>

                                        <Campo
                                            label="Período aproximado, se não souber a data"
                                            classe="campo-metade"
                                        >
                                            <input
                                                name="periodoFato"
                                                value={formulario.periodoFato}
                                                onChange={atualizarFormulario}
                                                maxLength="150"
                                                placeholder="Ex.: Durante julho de 2026"
                                            />
                                        </Campo>

                                        <Campo
                                            label="Testemunhas"
                                            classe="campo-largo"
                                        >
                                            <input
                                                name="testemunhas"
                                                value={formulario.testemunhas}
                                                onChange={atualizarFormulario}
                                                maxLength="500"
                                                placeholder="Informe nomes ou detalhes, se houver."
                                            />
                                        </Campo>

                                        <Campo
                                            label="Descreva o ocorrido"
                                            obrigatorio
                                            classe="campo-largo"
                                        >
                                            <textarea
                                                name="descricao"
                                                value={formulario.descricao}
                                                onChange={atualizarFormulario}
                                                minLength="20"
                                                maxLength="5000"
                                                rows="7"
                                                placeholder="Descreva os fatos: o que aconteceu, quando, onde e quem estava envolvido."
                                                required
                                            />
                                        </Campo>

                                        <Campo
                                            label="Como esta situação fez você se sentir? (opcional)"
                                            classe="campo-largo"
                                        >
                                            <textarea
                                                name="sentimento"
                                                value={formulario.sentimento}
                                                onChange={atualizarFormulario}
                                                maxLength="1000"
                                                rows="4"
                                                placeholder="Ex.: Senti medo, constrangimento, insegurança ou preocupação."
                                            />
                                        </Campo>

                                        <Campo
                                            label="Anexar evidências (opcional)"
                                            classe="campo-largo"
                                        >
                                            <input
                                                ref={inputAnexosRef}
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4,.webm"
                                                multiple
                                                onChange={selecionarAnexos}
                                            />

                                            <small className="ajuda-campo">
                                                Máximo de 3 arquivos, até 10 MB por arquivo e 20 MB no total.
                                                Formatos aceitos: JPG, PNG, WEBP, PDF, MP4 e WEBM.
                                            </small>
                                        </Campo>

                                        <div className="aviso aviso-anexos campo-largo">
                                            <strong>Atenção à sua privacidade</strong>

                                            <span>
                                                Arquivos podem conter informações que identifiquem você,
                                                como nome do autor, localização, data, dispositivo utilizado
                                                ou metadados do documento. Revise o conteúdo antes de anexar,
                                                especialmente em relatos anônimos.
                                            </span>
                                        </div>

                                        {anexos.length > 0 && (
                                            <ul className="lista-anexos">
                                                {anexos.map((anexo, indice) => (
                                                    <li key={`${anexo.name}-${anexo.lastModified}`}>
                                                        <span>
                                                            {anexo.name} —{' '}
                                                            {(anexo.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>

                                                        <button
                                                            type="button"
                                                            className="botao-link-perigo"
                                                            onClick={() => removerAnexo(indice)}
                                                        >
                                                            Remover
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <label className="checkbox-linha">
                                        <input
                                            type="checkbox"
                                            name="riscoImediato"
                                            checked={
                                                formulario.riscoImediato
                                            }
                                            onChange={atualizarFormulario}
                                        />
                                        <span>
                                            A situação envolve risco imediato à
                                            segurança ou integridade de alguém.
                                        </span>
                                    </label>

                                    {formulario.tipoEnvio ===
                                        'IDENTIFICADO' && (
                                        <section className="dados-identificacao">
                                            <div className="titulo-secao menor">
                                                <h3>Dados para contato</h3>
                                                <p>
                                                    Estes dados ficam separados
                                                    do relato e são acessados
                                                    somente pela equipe
                                                    responsável.
                                                </p>
                                            </div>

                                            <div className="grade-campos">
                                                <Campo
                                                    label="Nome"
                                                    obrigatorio
                                                >
                                                    <input
                                                        name="nome"
                                                        value={formulario.nome}
                                                        onChange={
                                                            atualizarFormulario
                                                        }
                                                        minLength="3"
                                                        maxLength="255"
                                                        required
                                                    />
                                                </Campo>

                                                <Campo label="Cargo ou vínculo">
                                                    <input
                                                        name="cargoOuVinculo"
                                                        value={
                                                            formulario.cargoOuVinculo
                                                        }
                                                        onChange={
                                                            atualizarFormulario
                                                        }
                                                        maxLength="150"
                                                        placeholder="Ex.: Colaborador"
                                                    />
                                                </Campo>

                                                <Campo label="E-mail">
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={
                                                            formulario.email
                                                        }
                                                        onChange={
                                                            atualizarFormulario
                                                        }
                                                        maxLength="254"
                                                        placeholder="voce@exemplo.com"
                                                    />
                                                </Campo>

                                                <Campo label="Telefone">
                                                    <input
                                                        name="telefone"
                                                        value={
                                                            formulario.telefone
                                                        }
                                                        onChange={
                                                            atualizarFormulario
                                                        }
                                                        maxLength="50"
                                                        placeholder="(00) 00000-0000"
                                                    />
                                                </Campo>
                                            </div>

                                            <p className="ajuda-campo">
                                                Informe ao menos um e-mail ou
                                                telefone.
                                            </p>
                                        </section>
                                    )}

                                    {erroRelato && (
                                        <p className="mensagem erro">
                                            {erroRelato}
                                        </p>
                                    )}

                                    <button
                                        className="botao primario"
                                        type="submit"
                                        disabled={enviandoRelato}
                                    >
                                        {enviandoRelato
                                            ? 'Enviando relato...'
                                            : 'Registrar relato'}
                                    </button>
                                </form>
                            )}
                        </section>
                    )}

                    {abaAtiva === 'acompanhar' && (
                        <section className="area-formulario">
                            <div className="titulo-secao">
                                <h2>Acompanhar relato anônimo</h2>
                                <p>
                                    Informe o protocolo e o código secreto
                                    recebidos ao registrar o relato.
                                </p>
                            </div>

                            <form
                                className="formulario-acompanhamento"
                                onSubmit={acompanharRelato}
                            >
                                <Campo label="Protocolo" obrigatorio>
                                    <input
                                        value={protocoloConsulta}
                                        onChange={(evento) =>
                                            setProtocoloConsulta(
                                                evento.target.value.toUpperCase()
                                            )
                                        }
                                        maxLength="30"
                                        placeholder="CDN-AAAA-MMDD-XXXXXXXX"
                                        required
                                    />
                                </Campo>

                                <Campo label="Código de acesso" obrigatorio>
                                    <input
                                        value={codigoAcessoConsulta}
                                        onChange={(evento) =>
                                            setCodigoAcessoConsulta(
                                                evento.target.value.toUpperCase()
                                            )
                                        }
                                        maxLength="30"
                                        placeholder="ABCD-EFGH-IJKL"
                                        required
                                    />
                                </Campo>

                                <button
                                    className="botao primario"
                                    type="submit"
                                    disabled={consultando}
                                >
                                    {consultando
                                        ? 'Consultando...'
                                        : 'Consultar relato'}
                                </button>
                            </form>

                            {erroConsulta && (
                                <p className="mensagem erro">
                                    {erroConsulta}
                                </p>
                            )}

                            {denunciaConsultada && (
                                <DetalheAcompanhamento
                                    dados={denunciaConsultada}
                                    novaMensagem={novaMensagem}
                                    aoAlterarMensagem={setNovaMensagem}
                                    aoEnviarMensagem={
                                        enviarMensagemComplementar
                                    }
                                    enviandoMensagem={enviandoMensagem}
                                    erroMensagem={erroMensagem}
                                    sucessoMensagem={sucessoMensagem}
                                    relatoEncerrado={relatoEncerrado}
                                />
                            )}
                        </section>
                    )}
                </section>
            </main>

            <footer className="rodape">
                <div className="container">
                    <strong>LDA - Laços, Diálogo e Atenção</strong>

                    <span>
                        Em caso de emergência ou risco imediato, procure o setor de
                        Gente e Gestão o mais rápido possível.
                    </span>

                    <span className="rodape-copyright">
                        © 2026 Todos os Direitos Reservados | Desenvolvido por
                        Tecnologia da Informação | LDA Logística
                    </span>
                </div>
            </footer>
        </div>
    );
}

function Campo({ label, obrigatorio = false, classe = '', children }) {
    return (
        <label className={`campo ${classe}`}>
            <span>
                {label}
                {obrigatorio && <b aria-label="Campo obrigatório"> *</b>}
            </span>
            {children}
        </label>
    );
}

function ResultadoRelato({ resultado, aoCriarOutro, aoAcompanhar }) {
    const denuncia = resultado.denuncia;
    const ehAnonimo = denuncia.tipoEnvio === 'ANONIMO';

    return (
        <div className="resultado-sucesso">
            <span className="icone-sucesso" aria-hidden="true">
                ✓
            </span>

            <h2>
                {ehAnonimo
                    ? 'Relato anônimo registrado com sucesso'
                    : 'Relato identificado registrado com sucesso'}
            </h2>

            <p>
                {ehAnonimo
                    ? 'O relato foi recebido e será analisado pela equipe responsável.'
                    : 'O relato foi recebido e será analisado pela equipe responsável.'}
            </p>

            <div className="protocolo-box">
                <span>Protocolo do relato</span>
                <strong>{denuncia.protocolo}</strong>
            </div>

            {ehAnonimo ? (
                <>
                    <div className="aviso aviso-importante">
                        <strong>
                            Atenção: guarde o protocolo e o código secreto.
                        </strong>

                        <span>
                            Eles serão necessários para acompanhar seu relato
                            anônimo. O código não poderá ser exibido novamente.
                        </span>
                    </div>

                    <div className="protocolo-box codigo-acesso-box">
                        <span>Código secreto de acesso</span>
                        <strong>{denuncia.codigoAcesso}</strong>
                    </div>

                    <div className="acoes-resultado">
                        <button
                            type="button"
                            className="botao primario"
                            onClick={aoAcompanhar}
                        >
                            Acompanhar relato
                        </button>

                        <button
                            type="button"
                            className="botao secundario"
                            onClick={aoCriarOutro}
                        >
                            Registrar outro relato
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="aviso aviso-identificado">
                        <strong>
                            Como funcionará o acompanhamento?
                        </strong>

                        <span>
                            Você informou dados de contato neste relato. As
                            atualizações e eventuais solicitações de informações
                            poderão ser encaminhadas ao e-mail ou telefone
                            informado.
                        </span>
                    </div>

                    <p className="texto-acompanhamento-identificado">
                        O acompanhamento online de relatos identificados será
                        disponibilizado em uma próxima versão, com confirmação
                        segura pelo e-mail cadastrado.
                    </p>

                    <div className="acoes-resultado">
                        <button
                            type="button"
                            className="botao secundario"
                            onClick={aoCriarOutro}
                        >
                            Registrar outro relato
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function DetalheAcompanhamento({
    dados,
    novaMensagem,
    aoAlterarMensagem,
    aoEnviarMensagem,
    enviandoMensagem,
    erroMensagem,
    sucessoMensagem,
    relatoEncerrado,
}) {
    const { denuncia, mensagens } = dados;

    return (
        <section className="detalhe-relato">
            <div className="cabecalho-relato">
                <div>
                    <span className="texto-discreto">Protocolo</span>
                    <h3>{denuncia.protocolo}</h3>
                </div>

                <Status status={denuncia.status} />
            </div>

            <div className="resumo-relato">
                <div>
                    <span>Categoria</span>
                    <strong>{denuncia.categoria}</strong>
                </div>

                <div>
                    <span>Registrado em</span>
                    <strong>{formatarDataHora(denuncia.criadoEm)}</strong>
                </div>

                <div>
                    <span>Risco imediato</span>
                    <strong>
                        {denuncia.riscoImediato ? 'Informado' : 'Não informado'}
                    </strong>
                </div>
            </div>

            <details className="detalhes-fato">
                <summary>Ver informações do relato</summary>

                <div className="conteudo-detalhes">
                    <p>
                        <strong>Pessoas envolvidas:</strong>{' '}
                        {denuncia.pessoasEnvolvidas}
                    </p>

                    {denuncia.testemunhas && (
                        <p>
                            <strong>Testemunhas:</strong>{' '}
                            {denuncia.testemunhas}
                        </p>
                    )}

                    {denuncia.localFato && (
                        <p>
                            <strong>Local:</strong> {denuncia.localFato}
                        </p>
                    )}

                    {denuncia.dataFato && (
                        <p>
                            <strong>Data do fato:</strong>{' '}
                            {formatarData(denuncia.dataFato)}
                        </p>
                    )}

                    {denuncia.periodoFato && (
                        <p>
                            <strong>Período aproximado:</strong>{' '}
                            {denuncia.periodoFato}
                        </p>
                    )}

                    <p>
                        <strong>Descrição:</strong>
                        <br />
                        {denuncia.descricao}
                    </p>
                </div>
            </details>

            <section className="secao-mensagens">
                <h3>Mensagens</h3>

                {mensagens.length === 0 ? (
                    <p className="texto-discreto">
                        Ainda não há mensagens neste relato.
                    </p>
                ) : (
                    <div className="lista-mensagens">
                        {mensagens.map((mensagem) => (
                            <article
                                key={mensagem.id}
                                className={
                                    mensagem.autor === 'RESPONSAVEL'
                                        ? 'mensagem responsavel'
                                        : 'mensagem denunciante'
                                }
                            >
                                <div className="mensagem-meta">
                                    <strong>
                                        {mensagem.autor === 'RESPONSAVEL'
                                            ? 'Equipe responsável'
                                            : 'Você'}
                                    </strong>
                                    <time>
                                        {formatarDataHora(mensagem.criadoEm)}
                                    </time>
                                </div>

                                <p>{mensagem.conteudo}</p>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {!relatoEncerrado ? (
                <form
                    className="formulario-mensagem"
                    onSubmit={aoEnviarMensagem}
                >
                    <h3>Enviar informação complementar</h3>

                    <textarea
                        value={novaMensagem}
                        onChange={(evento) =>
                            aoAlterarMensagem(evento.target.value)
                        }
                        maxLength="5000"
                        rows="5"
                        placeholder="Escreva uma informação adicional sobre o relato."
                        required
                    />

                    <div className="linha-acoes">
                        <span className="contador">
                            {novaMensagem.length}/5000
                        </span>

                        <button
                            className="botao primario"
                            type="submit"
                            disabled={enviandoMensagem}
                        >
                            {enviandoMensagem
                                ? 'Enviando...'
                                : 'Enviar mensagem'}
                        </button>
                    </div>

                    {erroMensagem && (
                        <p className="mensagem erro">{erroMensagem}</p>
                    )}

                    {sucessoMensagem && (
                        <p className="mensagem sucesso">{sucessoMensagem}</p>
                    )}
                </form>
            ) : (
                <p className="mensagem aviso">
                    Este relato foi encerrado e não aceita novas mensagens.
                </p>
            )}
        </section>
    );
}

function Status({ status }) {
    const textos = {
        RECEBIDO: 'Recebido',
        EM_TRIAGEM: 'Em triagem',
        EM_APURACAO: 'Em apuração',
        AGUARDANDO_INFORMACOES: 'Aguardando informações',
        CONCLUIDO: 'Concluído',
        ARQUIVADO: 'Arquivado',
    };

    return (
        <span className={`status status-${status?.toLowerCase()}`}>
            {textos[status] || status}
        </span>
    );
}

function formatarData(valor) {
    if (!valor) {
        return 'Não informada';
    }

    const somenteData = String(valor).slice(0, 10);
    const [ano, mes, dia] = somenteData.split('-');

    return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
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

export default App;