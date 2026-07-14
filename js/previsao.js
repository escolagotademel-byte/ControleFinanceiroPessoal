async function renderPrevisao() {
    setTitulo(
        "Fluxo Previsto",
        "Previsão financeira dos próximos meses"
    );

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

    const recorrenciasAtivas = recorrencias.filter(
        item => item.ativo !== false
    );

    const entradasRecorrentes = recorrenciasAtivas.filter(
        item => item.tipo === "entrada"
    );

    const saidasRecorrentes = recorrenciasAtivas.filter(
        item => item.tipo === "saida"
    );

    const totalEntradasRecorrentes = entradasRecorrentes.reduce(
        (total, item) => total + Number(item.valor || 0),
        0
    );

    const totalSaidasRecorrentes = saidasRecorrentes.reduce(
        (total, item) => total + Number(item.valor || 0),
        0
    );

    let saldoAcumulado = Number(saldoInicialRaw || 0);

    const hoje = new Date();
    const meses = [];

    for (let indice = 0; indice < 12; indice++) {
        const dataMes = new Date(
            hoje.getFullYear(),
            hoje.getMonth() + indice,
            1
        );

        const ano = dataMes.getFullYear();
        const mes = dataMes.getMonth();

        const chaveMes =
            `${ano}-${String(mes + 1).padStart(2, "0")}`;

        const entradasDoMes = entradas.filter(
            item => item.data?.slice(0, 7) === chaveMes
        );

        const saidasDoMes = saidas.filter(
            item => item.data?.slice(0, 7) === chaveMes
        );

        const totalEntradasManuais = entradasDoMes.reduce(
            (total, item) => total + Number(item.valor || 0),
            0
        );

        const totalSaidasManuais = saidasDoMes.reduce(
            (total, item) => total + Number(item.valor || 0),
            0
        );

        const totalEntradas =
            totalEntradasManuais +
            totalEntradasRecorrentes;

        const totalSaidas =
            totalSaidasManuais +
            totalSaidasRecorrentes;

        saldoAcumulado += totalEntradas - totalSaidas;

        const lancamentos = [
            ...entradasDoMes.map(item => ({
                data: item.data,
                descricao: item.descricao,
                valor: Number(item.valor || 0),
                tipo: "entrada",
                origem: "Entrada"
            })),

            ...saidasDoMes.map(item => ({
                data: item.data,
                descricao: item.descricao,
                valor: Number(item.valor || 0),
                tipo: "saida",
                origem: "Saída"
            })),

            ...entradasRecorrentes.map(item => ({
                data: montarDataRecorrencia(
                    ano,
                    mes,
                    item.dia
                ),
                descricao: item.descricao,
                valor: Number(item.valor || 0),
                tipo: "entrada",
                origem: "Entrada recorrente"
            })),

            ...saidasRecorrentes.map(item => ({
                data: montarDataRecorrencia(
                    ano,
                    mes,
                    item.dia
                ),
                descricao: item.descricao,
                valor: Number(item.valor || 0),
                tipo: "saida",
                origem: "Saída recorrente"
            }))
        ].sort((a, b) =>
            String(a.data).localeCompare(String(b.data))
        );

        meses.push({
            chaveMes,
            totalEntradas,
            totalSaidas,
            saldo: saldoAcumulado,
            lancamentos
        });
    }

    document.getElementById("app").innerHTML = `
        <section class="previsao-pessoal">

            <div class="lista-meses-pessoal">

                ${meses.map((mes, indice) => `
                    <article class="mes-previsao-card">

                        <button
                            type="button"
                            class="mes-previsao-cabecalho"
                            onclick="alternarDetalhesMes(${indice})"
                            aria-expanded="false"
                            id="botaoMes${indice}"
                        >
                            <div class="mes-previsao-titulo">
                                <strong>
                                    ${nomeMes(mes.chaveMes)}
                                </strong>

                                <span
                                    id="setaMes${indice}"
                                    class="seta-mes"
                                >
                                    ▼
                                </span>
                            </div>

                            <div class="mes-previsao-resumo">

                                <div class="resumo-previsao entrada">
                                    <span>Entradas</span>
                                    <strong>
                                        ${moeda(mes.totalEntradas)}
                                    </strong>
                                </div>

                                <div class="resumo-previsao saida">
                                    <span>Saídas</span>
                                    <strong>
                                        ${moeda(mes.totalSaidas)}
                                    </strong>
                                </div>

                                <div class="resumo-previsao saldo">
                                    <span>Saldo projetado</span>
                                    <strong>
                                        ${moeda(mes.saldo)}
                                    </strong>
                                </div>

                            </div>
                        </button>

                        <div
                            id="detalhesMes${indice}"
                            class="detalhes-mes-pessoal"
                            hidden
                        >
                            ${
                                mes.lancamentos.length
                                    ? mes.lancamentos.map(item => `
                                        <div class="lancamento-previsao">

                                            <div class="icone-previsao ${item.tipo}">
                                                ${
                                                    item.tipo === "entrada"
                                                        ? "↑"
                                                        : "↓"
                                                }
                                            </div>

                                            <div class="dados-previsao">
                                                <strong>
                                                    ${escapeHtml(item.descricao)}
                                                </strong>

                                                <span>
                                                    ${item.origem}
                                                    •
                                                    ${dataBR(item.data)}
                                                </span>
                                            </div>

                                            <strong class="valor-previsao ${item.tipo}">
                                                ${
                                                    item.tipo === "entrada"
                                                        ? "+ "
                                                        : "- "
                                                }
                                                ${moeda(item.valor)}
                                            </strong>

                                        </div>
                                    `).join("")
                                    : `
                                        <p class="msg">
                                            Nenhum lançamento previsto.
                                        </p>
                                    `
                            }
                        </div>

                    </article>
                `).join("")}

            </div>

        </section>
    `;
}

function alternarDetalhesMes(indice) {
    const detalhes = document.getElementById(
        `detalhesMes${indice}`
    );

    const botao = document.getElementById(
        `botaoMes${indice}`
    );

    const seta = document.getElementById(
        `setaMes${indice}`
    );

    if (!detalhes || !botao || !seta) {
        return;
    }

    const estaFechado = detalhes.hidden;

    detalhes.hidden = !estaFechado;
    botao.setAttribute(
        "aria-expanded",
        String(estaFechado)
    );

    seta.textContent = estaFechado ? "▲" : "▼";
}

function montarDataRecorrencia(ano, mes, dia) {
    const ultimoDia = new Date(
        ano,
        mes + 1,
        0
    ).getDate();

    const diaValido = Math.min(
        Math.max(Number(dia || 1), 1),
        ultimoDia
    );

    return (
        `${ano}-`
        + `${String(mes + 1).padStart(2, "0")}-`
        + `${String(diaValido).padStart(2, "0")}`
    );
}
