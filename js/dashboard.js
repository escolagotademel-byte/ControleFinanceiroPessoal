async function renderDashboard() {
    setTitulo(
        "💰 Financeiro Pessoal",
        "Resumo do seu mês"
    );

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();

    const [
        entradas,
        saidas,
        recorrencias,
        saldoInicialRaw
    ] = await Promise.all([
        buscar("entradas"),
        buscar("saidas"),
        buscar("recorrencias"),
        buscarConfig("saldoInicial")
    ]);

    const saldoInicial = Number(saldoInicialRaw || 0);

    function dataNoMesAtual(dataTexto) {
        if (!dataTexto) {
            return false;
        }

        const data = new Date(`${dataTexto}T00:00:00`);

        return (
            data.getFullYear() === anoAtual &&
            data.getMonth() === mesAtual
        );
    }

    function montarDataRecorrenciaAtual(dia) {
        const ultimoDiaMes = new Date(
            anoAtual,
            mesAtual + 1,
            0
        ).getDate();

        const diaValido = Math.min(
            Math.max(Number(dia || 1), 1),
            ultimoDiaMes
        );

        return (
            `${anoAtual}-`
            + `${String(mesAtual + 1).padStart(2, "0")}-`
            + `${String(diaValido).padStart(2, "0")}`
        );
    }

    const entradasMes = entradas.filter(
        item => dataNoMesAtual(item.data)
    );

    const saidasMes = saidas.filter(
        item => dataNoMesAtual(item.data)
    );

    const recorrenciasDoMesAteHoje = recorrencias.filter(
        item =>
            item.ativo !== false &&
            Number(item.dia || 1) <= diaAtual
    );

    const entradasRecorrentesRealizadas =
        recorrenciasDoMesAteHoje
            .filter(item => item.tipo === "entrada")
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

    const saidasRecorrentesRealizadas =
        recorrenciasDoMesAteHoje
            .filter(item => item.tipo === "saida")
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

    const entradasManuais = entradasMes.reduce(
        (soma, item) =>
            soma + Number(item.valor || 0),
        0
    );

    const saidasManuais = saidasMes.reduce(
        (soma, item) =>
            soma + Number(item.valor || 0),
        0
    );

    const totalEntradas =
        entradasManuais +
        entradasRecorrentesRealizadas;

    const totalSaidas =
        saidasManuais +
        saidasRecorrentesRealizadas;

    const saldo =
        saldoInicial +
        totalEntradas -
        totalSaidas;

    const recorrenciasParaLista =
        recorrenciasDoMesAteHoje.map(item => ({
            data: montarDataRecorrenciaAtual(item.dia),
            tipo:
                item.tipo === "entrada"
                    ? "entrada"
                    : "saida",
            tipoTexto:
                item.tipo === "entrada"
                    ? "Entrada recorrente"
                    : "Saída recorrente",
            descricao: `${item.descricao} (recorrente)`,
            valor: Number(item.valor || 0)
        }));

    const ultimosLancamentos = [
        ...entradasMes.map(item => ({
            data: item.data,
            tipo: "entrada",
            tipoTexto: "Entrada",
            descricao: item.descricao,
            valor: Number(item.valor || 0)
        })),

        ...saidasMes.map(item => ({
            data: item.data,
            tipo: "saida",
            tipoTexto: "Saída",
            descricao: item.descricao,
            valor: Number(item.valor || 0)
        })),

        ...recorrenciasParaLista
    ]
        .sort((a, b) =>
            String(b.data).localeCompare(
                String(a.data)
            )
        )
        .slice(0, 15);

    document.getElementById("app").innerHTML = `
        <section class="dashboard-app-pessoal">

            <div class="cards-financeiros-pessoal">

                <div class="card-financeiro saldo">
                    <span>Saldo disponível</span>

                    <strong>
                        ${moeda(saldo)}
                    </strong>
                </div>

                <div class="card-financeiro entrada">
                    <span>Entradas do mês</span>

                    <strong>
                        ${moeda(totalEntradas)}
                    </strong>
                </div>

                <div class="card-financeiro saida">
                    <span>Saídas do mês</span>

                    <strong>
                        ${moeda(totalSaidas)}
                    </strong>
                </div>

            </div>

            <div class="atalhos-pessoal">

                <button
                    type="button"
                    class="atalho-pessoal entrada"
                    onclick="navegar('entradas')"
                >
                    <span>➕</span>

                    <div>
                        <strong>Entradas</strong>
                        <small>
                            Cadastrar e consultar
                        </small>
                    </div>
                </button>

                <button
                    type="button"
                    class="atalho-pessoal saida"
                    onclick="navegar('saidas')"
                >
                    <span>➖</span>

                    <div>
                        <strong>Saídas</strong>
                        <small>
                            Cadastrar e consultar
                        </small>
                    </div>
                </button>

                <button
                    type="button"
                    class="atalho-pessoal recorrencia"
                    onclick="navegar('recorrencias')"
                >
                    <span>🔄</span>

                    <div>
                        <strong>Recorrências</strong>
                        <small>
                            Contas e receitas fixas
                        </small>
                    </div>
                </button>

                <button
                    type="button"
                    class="atalho-pessoal previsao"
                    onclick="navegar('previsao')"
                >
                    <span>📅</span>

                    <div>
                        <strong>Fluxo previsto</strong>
                        <small>
                            Consultar próximos meses
                        </small>
                    </div>
                </button>

            </div>

            <div class="painel painel-lancamentos-pessoal">

                <div class="titulo-lancamentos-pessoal">
                    <h2>Últimos lançamentos</h2>

                    <p>
                        Movimentações do mês atual
                    </p>
                </div>

                ${
                    ultimosLancamentos.length
                        ? `
                            <div class="lista-lancamentos-pessoal">

                                ${ultimosLancamentos.map(
                                    item => `
                                        <div class="lancamento-pessoal">

                                            <div class="icone-lancamento-pessoal ${
                                                item.tipo
                                            }">
                                                ${
                                                    item.tipo === "entrada"
                                                        ? "↑"
                                                        : "↓"
                                                }
                                            </div>

                                            <div class="dados-lancamento-pessoal">
                                                <strong>
                                                    ${escapeHtml(
                                                        item.descricao
                                                    )}
                                                </strong>

                                                <span>
                                                    ${item.tipoTexto}
                                                    •
                                                    ${dataBR(
                                                        item.data
                                                    )}
                                                </span>
                                            </div>

                                            <strong class="valor-lancamento-pessoal ${
                                                item.tipo
                                            }">
                                                ${
                                                    item.tipo === "saida"
                                                        ? "- "
                                                        : "+ "
                                                }

                                                ${moeda(
                                                    item.valor
                                                )}
                                            </strong>

                                        </div>
                                    `
                                ).join("")}

                            </div>
                        `
                        : `
                            <p class="msg">
                                Nenhum lançamento cadastrado neste mês.
                            </p>
                        `
                }

            </div>

        </section>
    `;
}
