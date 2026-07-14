let paginaAtual = 'dashboard';

document.addEventListener('DOMContentLoaded', async () => {
    const menu = document.querySelector('.sidebar');

    /*
     * Um único evento controla todos os botões do menu.
     * Esse formato funciona melhor no celular.
     */
    menu.addEventListener('click', async event => {
        const botao = event.target.closest('.nav');

        if (!botao) {
            return;
        }

        event.preventDefault();

        const pagina = botao.dataset.page;

        if (!pagina) {
            return;
        }

        await navegar(pagina);
    });

    await testarConexao();
    await navegar('dashboard');
});

function setTitulo(titulo, subtitulo) {
    const tituloElemento = document.getElementById('pageTitle');
    const subtituloElemento = document.getElementById('pageSubtitle');

    if (tituloElemento) {
        tituloElemento.textContent = titulo;
    }

    if (subtituloElemento) {
        subtituloElemento.textContent = subtitulo || '';
    }
}

function setActive(page) {
    document.querySelectorAll('.nav').forEach(botao => {
        botao.classList.toggle(
            'active',
            botao.dataset.page === page
        );
    });
}

async function navegar(page) {
    paginaAtual = page;
    setActive(page);

    const app = document.getElementById('app');

    if (!app) {
        console.error('Área principal do sistema não encontrada.');
        return;
    }

    app.innerHTML = `
        <div class="painel">
            <p class="msg">Carregando...</p>
        </div>
    `;

    try {
        switch (page) {
            case 'dashboard':
                await renderDashboard();
                break;

            case 'entradas':
                await renderEntradas();
                break;

            case 'saidas':
                await renderSaidas();
                break;

            case 'recorrencias':
                await renderRecorrencias();
                break;

            case 'previsao':
                await renderPrevisao();
                break;

            case 'configuracoes':
                await renderConfiguracoes();
                break;

            default:
                await renderDashboard();
                break;
        }

        /*
         * Ao trocar de página no celular,
         * volta automaticamente ao início da tela.
         */
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } catch (erro) {
        console.error(erro);

        app.innerHTML = `
            <div class="painel">
                <p class="msg">
                    Erro: ${escapeHtml(
                        erro?.message || 'Não foi possível abrir esta página.'
                    )}
                </p>
            </div>
        `;
    }
}
