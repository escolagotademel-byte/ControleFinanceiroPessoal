async function renderPrevisao() {
    setTitulo(
        'Fluxo Previsto',
        'Previsão financeira dos próximos meses'
    );

    const [
        entradas,
        saidas,
        recorrencias,
        saldoInicialRaw
    ] = await Promise.all([
        buscar('entradas'),
        buscar('saidas'),
        buscar('recorrencias'),
        buscarConfig('saldoInicial')
    ]);

    const recorrenciasAtivas = recorrencias.filter(
        item => item.ativo !== false
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
            `${ano}-${String(mes + 1).padStart(2, '0')}`;

        const entradasDoMes = entradas.filter(
            item => item.data?.slice(0, 7) === chaveMes
        );

        const saidasDoMes = saidas.filter(
            item => item.data?.slice(0, 7) === chaveMes
        );

        const entradasRecorrentes = recorrenciasAtivas.filter(
            item => item.tipo === 'entrada'
        );

        const saidasRecorrentes = recorrenciasAtivas.filter(
            item => item.tipo === 'saida'
        );

        const totalEntradasManuais = entradasDoMes.reduce(
            (total, item) => total + Number(item.valor),
            0
        );

        const totalSaidasManuais = saidasDoMes.reduce(
            (total, item) => total + Number(item.valor),
            0
        );

        const totalEntradasRecorrentes =
            entradasRecorrentes.reduce(
                (total, item) => total + Number(item.valor),
                0
            );

        const totalSaidasRecorrentes =
            saidasRecorrentes.reduce(
                (total, item) => total + Number(item.valor),
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
                valor: Number(item.valor),
                tipo: 'entrada'
            })),

            ...saidasDoMes.map(item => ({
                data: item.data,
                descricao: item.descricao,
                valor: Number(item.valor),
                tipo: 'saida'
            })),

            ...entradasRecorrentes.map(item => ({
                data: montarDataRecorrencia(
                    ano,
                    mes,
                    item.dia
                ),
                descricao: `${item.descricao} (recorrente)`,
                valor: Number(item.valor),
                tipo: 'entrada'
            })),

            ...saidasRecorrentes.map(item => ({
                data: montarDataRecorrencia(
                    ano,
                    mes,
                    item.dia
                ),
                descricao: `${item.descricao} (recorrente)`,
                valor: Number(item.valor),
                tipo: 'saida'
            }))
        ].sort((a, b) => a.data.localeCompare(b.data));

        meses.push({
            chaveMes,
            totalEntradas,
            totalSaidas,
            saldo: saldoAcumulado,
            lancamentos
        });
    }

    document.getElementById('app').innerHTML = `
        <div class="painel">
            <div class="lista-meses">
                ${meses.map(mes => `
                    <details class="mes-card">
                        <summary>
                            <div>
                                <strong>${nomeMes(mes.chaveMes)}</strong>
                            </div>

                            <div>
                                <span>
                                    Entradas:
                                    <strong>${moeda(mes.totalEntradas)}</strong>
                                </span>

                                <span>
                                    Saídas:
                                    <strong>${moeda(mes.totalSaidas)}</strong>
                                </span>

                                <span>
                                    Saldo projetado:
                                    <strong>${moeda(mes.saldo)}</strong>
                                </span>
                            </div>
                        </summary>

                        <div class="mes-detalhes">
                            ${
                                mes.lancamentos.length
                                    ? `
                                        <table class="table">
                                            <thead>
                                                <tr>
                                                    <th>Data</th>
                                                    <th>Tipo</th>
                                                    <th>Descrição</th>
                                                    <th>Valor</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                ${mes.lancamentos.map(item => `
                                                    <tr>
                                                        <td>${dataBR(item.data)}</td>

                                                        <td>
                                                            ${
                                                                item.tipo === 'entrada'
                                                                    ? 'Entrada'
                                                                    : 'Saída'
                                                            }
                                                        </td>

                                                        <td>
                                                            ${escapeHtml(item.descricao)}
                                                        </td>

                                                        <td>
                                                            ${
                                                                item.tipo === 'entrada'
                                                                    ? '+ '
                                                                    : '- '
                                                            }
                                                            ${moeda(item.valor)}
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    `
                                    : `
                                        <p class="msg">
                                            Nenhum lançamento previsto.
                                        </p>
                                    `
                            }
                        </div>
                    </details>
                `).join('')}
            </div>
        </div>
    `;
}

function montarDataRecorrencia(ano, mes, dia) {
    const ultimoDia = new Date(
        ano,
        mes + 1,
        0
    ).getDate();

    const diaValido = Math.min(
        Number(dia || 1),
        ultimoDia
    );

    return (
        `${ano}-`
        + `${String(mes + 1).padStart(2, '0')}-`
        + `${String(diaValido).padStart(2, '0')}`
    );
}
