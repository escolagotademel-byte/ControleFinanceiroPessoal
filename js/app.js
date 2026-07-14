let paginaAtual = "dashboard";

document.addEventListener("DOMContentLoaded", async () => {
    await testarConexao();
    await navegar("dashboard");
});

function setTitulo(titulo, subtitulo) {
    const tituloElemento =
        document.getElementById("pageTitle");

    const subtituloElemento =
        document.getElementById("pageSubtitle");

    if (tituloElemento) {
        tituloElemento.textContent = titulo;
    }

    if (subtituloElemento) {
        subtituloElemento.textContent =
            subtitulo || "";
    }
}

function controlarBotaoInicio(pagina) {
    const botao =
        document.getElementById("btnVoltarInicio");

    if (!botao) {
        return;
    }

    botao.hidden = pagina === "dashboard";
}

async function navegar(pagina) {
    paginaAtual = pagina;

    controlarBotaoInicio(pagina);

    const app = document.getElementById("app");

    if (!app) {
        console.error(
            "Área principal do sistema não encontrada."
        );

        return;
    }

    app.innerHTML = `
        <div class="painel">
            <p class="msg">Carregando...</p>
        </div>
    `;

    try {
        switch (pagina) {
            case "dashboard":
                await renderDashboard();
                break;

            case "entradas":
                await renderEntradas();
                break;

            case "saidas":
                await renderSaidas();
                break;

            case "recorrencias":
                await renderRecorrencias();
                break;

            case "previsao":
                await renderPrevisao();
                break;

            default:
                await renderDashboard();
                break;
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    } catch (erro) {
        console.error(erro);

        app.innerHTML = `
            <div class="painel">
                <p class="msg">
                    Erro: ${escapeHtml(
                        erro?.message ||
                        "Não foi possível abrir esta página."
                    )}
                </p>

                <button
                    class="btn"
                    type="button"
                    onclick="navegar('dashboard')"
                >
                    Voltar ao início
                </button>
            </div>
        `;
    }
}
