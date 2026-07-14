async function renderDashboard() {
    setTitulo(
        "Financeiro Pessoal",
        "Resumo do seu mês"
    );

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

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

    const entradasMes = entradas.filter(
        item => dataNoMesAtual(item.data)
    );

    const saidasMes = saidas.filter(
        item => dataNoMesAtual(item.data)
    );

    const recorrenciasAtivas = recorrencias.filter(
        item => item.ativo !== false
    );

    const entradasRecorrentes = recorrenciasAtivas
        .filter(item => item.tipo === "entrada")
        .reduce(
            (soma, item) => soma + Number(item.valor || 0),
            0
        );

    const saidasRecorrentes = recorrenciasAtivas
        .filter(item => item.tipo === "saida")
        .reduce(
            (soma, item) => soma + Number(item.valor || 0),
            0
        );

    const totalEntradasManuais = entradasMes.reduce(
        (soma, item) => soma + Number(item.valor || 0),
        0
    );

    const totalSaidasManuais = saidasMes.reduce(
        (soma, item) => soma + Number(item.valor || 0),
        0
    );

    const totalEntradas =
        totalEntradasManuais +
        entradasRecorrentes;

    const totalSaidas =
        totalSaidasManuais +
        saidasRecorrentes;

    const saldo =
        saldoInicial +
        totalEntradas -
        totalSaidas;

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
        }))
    ]
        .sort((a, b) =>
            String(b.data).localeCompare(String(a.data))
        )
        .slice(0, 15);

    document.getElementById("app").innerHTML = `
        <section class="dashboard-simples">

            <div class="resumo-dashboard-simples">

                <div class="resumo-card-simples saldo">
                    <span>Saldo disponível</span>
                    <strong>${moeda(saldo)}</strong>
                </div>

                <div class="resumo-card-simples entrada">
                    <span>Entradas do mês</span>
                    <strong>${moeda(totalEntradas)}</strong>
                </div>

                <div class="resumo-card-simples saida">
                    <span>Saídas do mês</span>
                    <strong>${moeda(totalSaidas)}</strong>
                </div>

                <div class="resumo-card-simples inicial">
                    <span>Saldo inicial</span>
                    <strong>${moeda(saldoInicial)}</strong>
                </div>

            </div>

            <div class="acoes-dashboard-simples">

                <button
                    type="button"
                    class="acao-dashboard entrada"
                    onclick="navegar('entradas')"
                >
                    <span>➕</span>
                    Nova entrada
                </button>

                <button
                    type="button"
                    class="acao-dashboard saida"
                    onclick="navegar('saidas')"
                >
                    <span>➖</span>
                    Nova saída
                </button>

                <button
                    type="button"
                    class="acao-dashboard recorrencia"
                    onclick="navegar('recorrencias')"
                >
                    <span>🔄</span>
                    Recorrências
                </button>

                <button
                    type="button"
                    class="acao-dashboard previsao"
                    onclick="navegar('previsao')"
                >
                    <span>📅</span>
                    Fluxo previsto
                </button>

            </div>

            
                        <span>Entradas manuais</span>
                        <strong>${moeda(totalEntradasManuais)}</strong>
                    </div>

                    <div>
                        <span>Entradas recorrentes</span>
                        <strong>${moeda(entradasRecorrentes)}</strong>
                    </div>

                    <div class="saida">
                        <span>Saídas manuais</span>
                        <strong>${moeda(totalSaidasManuais)}</strong>
                    </div>

                    <div class="saida">
                        <span>Saídas recorrentes</span>
                        <strong>${moeda(saidasRecorrentes)}</strong>
                    </div>

                </div>
            </div>

            <div class="painel">
                <h2>Últimos lançamentos</h2>

                ${
                    ultimosLancamentos.length
                        ? `
                            <div class="lista-lancamentos-simples">

                                ${ultimosLancamentos.map(item => `
                                    <div class="lancamento-simples">

                                        <div class="icone-lancamento ${item.tipo}">
                                            ${
                                                item.tipo === "entrada"
                                                    ? "↑"
                                                    : "↓"
                                            }
                                        </div>

                                        <div class="dados-lancamento">
                                            <strong>
                                                ${escapeHtml(item.descricao)}
                                            </strong>

                                            <span>
                                                ${item.tipoTexto}
                                                •
                                                ${dataBR(item.data)}
                                            </span>
                                        </div>

                                        <strong class="valor-lancamento ${item.tipo}">
                                            ${
                                                item.tipo === "saida"
                                                    ? "- "
                                                    : "+ "
                                            }
                                            ${moeda(item.valor)}
                                        </strong>

                                    </div>
                                `).join("")}

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
