/**
 * ============================================
 * TEAM AGUA LONGA - Aplicação Principal
 * ============================================
 * 
 * Módulo principal que gere a navegação, login,
 * modais, e toda a lógica da aplicação.
 */

const App = {

    /** Estado da aplicação */
    isAdmin: false,
    currentPage: 'dashboard',
    currentFilters: {
        season: 'all',
        mode: 'all',
        result: 'all',
        dateFrom: '',
        dateTo: ''
    },
    currentDetailPlayer: null,

    /**
     * ============================================
     * INICIALIZAÇÃO
     * ============================================
     */
    init() {
        // Verificar se já existe sessão
        const savedRole = localStorage.getItem('rlstats_role');
        if (savedRole === 'admin' || savedRole === 'player') {
            this.isAdmin = savedRole === 'admin';
            this.showApp();
        }

        // Verificar tema guardado
        const savedTheme = localStorage.getItem('rlstats_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            this.updateThemeIcon();
        }

        // Enter key para login
        document.getElementById('admin-pass').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.adminLogin();
        });
        document.getElementById('admin-user').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.adminLogin();
        });

        // Fechar sidebar ao clicar fora no mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                !e.target.closest('.mobile-menu-btn')) {
                this.closeSidebar();
            }
        });
    },

    /**
     * ============================================
     * SISTEMA DE LOGIN
     * ============================================
     */

    /** Login como jogador (apenas consulta) */
    loginAsPlayer() {
        this.isAdmin = false;
        localStorage.setItem('rlstats_role', 'player');
        this.showApp();
    },

    /** Mostra o formulário de login do admin */
    showAdminLogin() {
        document.querySelector('.login-options').classList.add('hidden');
        document.getElementById('admin-login-form').classList.remove('hidden');
        document.getElementById('admin-user').focus();
    },

    /** Esconde o formulário de login do admin */
    hideAdminLogin() {
        document.querySelector('.login-options').classList.remove('hidden');
        document.getElementById('admin-login-form').classList.add('hidden');
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('admin-user').value = '';
        document.getElementById('admin-pass').value = '';
    },

    /** Login do administrador */
    adminLogin() {
        const user = document.getElementById('admin-user').value.trim();
        const pass = document.getElementById('admin-pass').value;

        if (user === 'admin' && pass === '123') {
            this.isAdmin = true;
            localStorage.setItem('rlstats_role', 'admin');
            this.showApp();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
            // Reset do formulário
            document.getElementById('admin-pass').value = '';
            document.getElementById('admin-pass').focus();
        }
    },

    /** Mostra a aplicação principal */
    showApp() {
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('app').classList.remove('hidden');

        // Atualizar informação do utilizador
        const userLabel = document.getElementById('current-user');
        userLabel.textContent = this.isAdmin ? 'Admin (Líder)' : 'Jogador';

        // Renderizar a página inicial
        this.navigate('dashboard');

        // Mostrar aviso admin apenas a primeira vez
        if (this.isAdmin && !sessionStorage.getItem('rlstats_admin_warned')) {
            sessionStorage.setItem('rlstats_admin_warned', 'true');
            setTimeout(() => {
                Utils.showToast(
                    '⚠️ Admin: As alterações ficam apenas neste navegador. Use o botão ☁️ para descarregar os ficheiros e substituir no GitHub.',
                    'info',
                    8000
                );
            }, 1500);
        }
    },

    /** Terminar sessão */
    logout() {
        this.isAdmin = false;
        localStorage.removeItem('rlstats_role');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login-modal').classList.add('active');
        this.hideAdminLogin();
        Charts.destroyAll();
    },

    /**
     * ============================================
     * NAVEGAÇÃO
     * ============================================
     */

    /**
     * Navega para uma página
     * @param {string} page - Nome da página
     * @param {string} param - Parâmetro opcional (ex: ID do jogador)
     */
    navigate(page, param) {
        Charts.destroyAll();
        this.currentPage = page;

        // Atualizar nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Fechar sidebar no mobile
        this.closeSidebar();

        // Renderizar conteúdo
        const content = document.getElementById('page-content');
        let pageContent = '';

        switch (page) {
            case 'dashboard':
                pageContent = Pages.dashboard();
                break;
            case 'players':
                pageContent = Pages.players();
                break;
            case 'playerDetail':
                this.currentDetailPlayer = param;
                pageContent = Pages.playerDetail(param);
                break;
            case 'matches':
                pageContent = Pages.matches();
                break;
            case 'rankings':
                pageContent = Pages.rankings();
                break;
            case 'statistics':
                pageContent = Pages.statistics();
                break;
            default:
                pageContent = Pages.dashboard();
        }

        content.innerHTML = pageContent;

        // Rolar para o topo
        content.scrollTo(0, 0);

        // Inicializar gráficos da página
        this.initPageCharts(page, param);
    },

    /**
     * Inicializa gráficos baseado na página atual
     * @param {string} page - Nome da página
     * @param {string} param - Parâmetro opcional
     */
    initPageCharts(page, param) {
        switch (page) {
            case 'dashboard':
                Pages.initDashboardCharts();
                break;
            case 'playerDetail':
                Pages.initPlayerDetailCharts(param);
                break;
            case 'rankings':
                Pages.initRankingsCharts();
                break;
        }
    },

    /**
     * Mostra o detalhe de um jogador
     * @param {string} playerId - ID do jogador
     */
    showPlayerDetail(playerId) {
        this.navigate('playerDetail', playerId);
    },

    /**
     * ============================================
     * SIDEBAR
     * ============================================
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');

        // Gerir overlay
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.onclick = () => this.closeSidebar();
            document.body.appendChild(overlay);
        }
        overlay.classList.toggle('active', sidebar.classList.contains('open'));
    },

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('open');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    /**
     * ============================================
     * TEMA (DARK/LIGHT)
     * ============================================
     */
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('rlstats_theme', newTheme);
        this.updateThemeIcon();

        // Recriar gráficos com novas cores
        this.initPageCharts(this.currentPage, this.currentDetailPlayer);
    },

    updateThemeIcon() {
        const theme = document.documentElement.getAttribute('data-theme');
        const icon = document.getElementById('theme-icon');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    },

    /**
     * ============================================
     * PESQUISA
     * ============================================
     */
    handleSearch: (function() {
        const debouncedFn = Utils.debounce(function(query) {
            if (!query || query.length < 2) return;

            const lower = query.toLowerCase();
            const results = PLAYERS_DATA.filter(p => 
                p.name.toLowerCase().includes(lower) || 
                p.tag.toLowerCase().includes(lower)
            );

            if (results.length === 1) {
                App.showPlayerDetail(results[0].id);
            } else if (results.length > 0) {
                App.navigate('players');
            }
        }, 400);

        return function(query) {
            debouncedFn(query);
        };
    })(),

    /**
     * ============================================
     * FILTROS
     * ============================================
     */

    /**
     * Define um filtro e re-renderiza a página de partidas
     * @param {string} key - Chave do filtro
     * @param {string} value - Valor do filtro
     */
    setFilter(key, value) {
        this.currentFilters[key] = value;
        this.navigate('matches');
    },

    /**
     * ============================================
     * MODAIS
     * ============================================
     */

    /**
     * Abre um modal
     * @param {string} modalId - ID do modal
     */
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    /**
     * Fecha um modal
     * @param {string} modalId - ID do modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    /**
     * ============================================
     * GESTÃO DE PARTIDAS (ADMIN)
     * ============================================
     */

    /**
     * Abre o modal para adicionar/editar partida
     * @param {string} matchId - ID da partida (null para adicionar nova)
     */
    openMatchModal(matchId = null) {
        const form = document.getElementById('match-form');
        const title = document.getElementById('match-modal-title');

        // Reset form
        form.reset();
        document.getElementById('match-edit-id').value = '';

        // Preencher checkboxes de jogadores
        const checkboxesContainer = document.getElementById('match-players-checkboxes');
        checkboxesContainer.innerHTML = PLAYERS_DATA.map(player => `
            <label class="checkbox-item">
                <input type="checkbox" name="match-players" value="${player.id}">
                ${player.name}
            </label>
        `).join('');

        // Preencher select de MVP
        const mvpSelect = document.getElementById('match-mvp');
        mvpSelect.innerHTML = '<option value="">Nenhum</option>' + 
            PLAYERS_DATA.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        // Se editar, preencher dados
        if (matchId) {
            title.textContent = 'Editar Partida';
            const match = MATCHES_DATA.find(m => m.id === matchId);
            if (match) {
                document.getElementById('match-edit-id').value = match.id;
                document.getElementById('match-date').value = match.date;
                document.getElementById('match-season').value = match.season;
                document.getElementById('match-mode').value = match.mode;
                document.getElementById('match-result').value = match.result;
                document.getElementById('match-goals-team').value = match.goalsTeam;
                document.getElementById('match-goals-against').value = match.goalsAgainst;
                document.getElementById('match-opponent').value = match.opponent || '';

                // Marcar jogadores participantes
                match.players.forEach(pid => {
                    const cb = checkboxesContainer.querySelector(`input[value="${pid}"]`);
                    if (cb) cb.checked = true;
                });

                // Selecionar MVP
                if (match.mvp) {
                    mvpSelect.value = match.mvp;
                }
            }
        } else {
            title.textContent = 'Adicionar Partida';
            // Data de hoje por defeito
            document.getElementById('match-date').value = new Date().toISOString().split('T')[0];
        }

        this.openModal('match-modal');
    },

    /**
     * Guarda uma partida (adicionar ou editar)
     * @param {Event} event - Evento do formulário
     */
    saveMatch(event) {
        event.preventDefault();

        const editId = document.getElementById('match-edit-id').value;
        const selectedPlayers = Array.from(
            document.querySelectorAll('input[name="match-players"]:checked')
        ).map(cb => cb.value);

        if (selectedPlayers.length === 0) {
            Utils.showToast('Selecione pelo menos um jogador!', 'error');
            return;
        }

        const matchData = {
            id: editId || Utils.generateId(),
            date: document.getElementById('match-date').value,
            season: document.getElementById('match-season').value.trim(),
            mode: document.getElementById('match-mode').value,
            result: document.getElementById('match-result').value,
            goalsTeam: parseInt(document.getElementById('match-goals-team').value),
            goalsAgainst: parseInt(document.getElementById('match-goals-against').value),
            opponent: document.getElementById('match-opponent').value.trim(),
            players: selectedPlayers,
            mvp: document.getElementById('match-mvp').value || null,
            playerStats: {}
        };

        // Criar estatísticas base para cada jogador participante
        selectedPlayers.forEach(pid => {
            // Se editar, manter stats existentes
            if (editId) {
                const existingMatch = MATCHES_DATA.find(m => m.id === editId);
                if (existingMatch && existingMatch.playerStats[pid]) {
                    matchData.playerStats[pid] = existingMatch.playerStats[pid];
                    return;
                }
            }
            // Stats base zeradas
            matchData.playerStats[pid] = { goals: 0, assists: 0, saves: 0, shots: 0 };
        });

        if (editId) {
            // Editar partida existente
            const index = MATCHES_DATA.findIndex(m => m.id === editId);
            if (index !== -1) {
                MATCHES_DATA[index] = matchData;
                Utils.showToast('Partida atualizada com sucesso!', 'success');
            }
        } else {
            // Adicionar nova partida
            MATCHES_DATA.push(matchData);
            Utils.showToast('Partida adicionada com sucesso!', 'success');
        }

        this.closeModal('match-modal');
        this.navigate('matches');

        // Lembrar de guardar no GitHub
        setTimeout(() => {
            Utils.showToast(
                '💡 Lembre-se: use o botão ☁️ no topo para descarregar os ficheiros e atualizar no GitHub.',
                'info',
                5000
            );
        }, 1000);
    },

    /**
     * Remove uma partida
     * @param {string} matchId - ID da partida
     */
    deleteMatch(matchId) {
        if (!Utils.confirm('Tem a certeza que deseja remover esta partida?')) return;

        const index = MATCHES_DATA.findIndex(m => m.id === matchId);
        if (index !== -1) {
            MATCHES_DATA.splice(index, 1);
            Utils.showToast('Partida removida com sucesso!', 'success');
            this.navigate('matches');
        }
    },

    /**
     * ============================================
     * GESTÃO DE JOGADORES (ADMIN)
     * ============================================
     */

    /**
     * Abre o modal para adicionar/editar jogador
     * @param {string} playerId - ID do jogador (null para adicionar novo)
     */
    openPlayerModal(playerId = null) {
        const form = document.getElementById('player-form');
        const title = document.getElementById('player-modal-title');

        form.reset();
        document.getElementById('player-edit-id').value = '';

        if (playerId) {
            title.textContent = 'Editar Jogador';
            const player = PLAYERS_DATA.find(p => p.id === playerId);
            if (player) {
                document.getElementById('player-edit-id').value = player.id;
                document.getElementById('player-name').value = player.name;
                document.getElementById('player-tag').value = player.tag || '';
                document.getElementById('player-platform').value = player.platform || 'PC';
                document.getElementById('player-rlid').value = player.rlId || '';
            }
        } else {
            title.textContent = 'Adicionar Jogador';
        }

        this.openModal('player-modal');
    },

    /**
     * Guarda um jogador (adicionar ou editar)
     * @param {Event} event - Evento do formulário
     */
    savePlayer(event) {
        event.preventDefault();

        const editId = document.getElementById('player-edit-id').value;

        const playerData = {
            id: editId || Utils.generateId(),
            name: document.getElementById('player-name').value.trim(),
            tag: document.getElementById('player-tag').value.trim(),
            platform: document.getElementById('player-platform').value,
            rlId: document.getElementById('player-rlid').value.trim(),
            joinDate: editId ? (PLAYERS_DATA.find(p => p.id === editId)?.joinDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            role: editId ? (PLAYERS_DATA.find(p => p.id === editId)?.role || 'player') : 'player',
            color: editId ? (PLAYERS_DATA.find(p => p.id === editId)?.color || '#f97316') : ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308'][Math.floor(Math.random() * 6)]
        };

        if (editId) {
            const index = PLAYERS_DATA.findIndex(p => p.id === editId);
            if (index !== -1) {
                PLAYERS_DATA[index] = { ...PLAYERS_DATA[index], ...playerData };
                Utils.showToast('Jogador atualizado com sucesso!', 'success');
            }
        } else {
            PLAYERS_DATA.push(playerData);
            Utils.showToast('Jogador adicionado com sucesso!', 'success');
        }

        this.closeModal('player-modal');

        // Navegar para a página apropriada
        if (editId && this.currentPage === 'playerDetail') {
            this.navigate('playerDetail', editId);
        } else {
            this.navigate('players');
        }

        // Lembrar de guardar no GitHub
        setTimeout(() => {
            Utils.showToast(
                '💡 Lembre-se: use o botão ☁️ no topo para descarregar os ficheiros e atualizar no GitHub.',
                'info',
                5000
            );
        }, 1000);
    },

    /**
     * Remove um jogador
     * @param {string} playerId - ID do jogador
     */
    deletePlayer(playerId) {
        const player = PLAYERS_DATA.find(p => p.id === playerId);
        if (!player) return;

        if (!Utils.confirm(`Tem a certeza que deseja remover "${player.name}"?`)) return;

        const index = PLAYERS_DATA.findIndex(p => p.id === playerId);
        if (index !== -1) {
            PLAYERS_DATA.splice(index, 1);
            Utils.showToast('Jogador removido com sucesso!', 'success');
            this.navigate('players');
        }
    },

    /**
     * ============================================
     * EXPORTAÇÃO CSV
     * ============================================
     */

    /** Sincroniza dados: tenta GitHub API ou descarrega ficheiros */
    syncToGitHub() {
        if (typeof GitHub !== 'undefined' && GitHub.isConfigured()) {
            // GitHub API configurado — usar diretamente
            GitHub.saveAndNotify();
        } else {
            // Sem configuração — descarregar ficheiros para substituição manual
            App.exportDataAsFile();
        }
    },

    /** Exporta dados como ficheiro JS pronto para o GitHub */
    exportDataAsFile() {
        const playersCode = `const PLAYERS_DATA = ${JSON.stringify(PLAYERS_DATA, null, 4)};`;
        const matchesCode = `const MATCHES_DATA = ${JSON.stringify(MATCHES_DATA, null, 4)};`;

        // Download players.js
        const blob1 = new Blob(['\ufeff' + playersCode], { type: 'text/javascript;charset=utf-8;' });
        const link1 = document.createElement('a');
        link1.href = URL.createObjectURL(blob1);
        link1.download = 'players.js';
        link1.click();
        URL.revokeObjectURL(link1.href);

        // Download matches.js
        setTimeout(() => {
            const blob2 = new Blob(['\ufeff' + matchesCode], { type: 'text/javascript;charset=utf-8;' });
            const link2 = document.createElement('a');
            link2.href = URL.createObjectURL(blob2);
            link2.download = 'matches.js';
            link2.click();
            URL.revokeObjectURL(link2.href);
        }, 500);

        Utils.showToast(
            'Ficheiros JS exportados! Substitua os ficheiros em data/ no repositório GitHub.',
            'success',
            5000
        );
    },

    /** Exporta todas as estatísticas para CSV */
    exportAllCSV() {
        // Exportar estatísticas dos jogadores
        const headers = [
            'Jogador', 'Tag', 'Plataforma', 'Jogos', 'Vitórias', 'Derrotas', 
            'Win Rate (%)', 'Golos', 'Assistências', 'Defesas', 'Remates', 
            'Precisão (%)', 'Média Golos/J', 'Média Assists/J', 'Média Defesas/J', 'MVPs'
        ];

        const rows = PLAYERS_DATA.map(player => {
            const stats = Utils.getPlayerStats(player.id);
            return [
                player.name,
                player.tag,
                player.platform,
                stats.totalGames,
                stats.wins,
                stats.losses,
                stats.winRate,
                stats.totalGoals,
                stats.totalAssists,
                stats.totalSaves,
                stats.totalShots,
                stats.shotAccuracy,
                stats.avgGoals,
                stats.avgAssists,
                stats.avgSaves,
                stats.mvps
            ];
        });

        Utils.exportToCSV('rl_stats_jogadores', headers, rows);

        // Exportar histórico de partidas
        setTimeout(() => {
            const matchHeaders = [
                'Data', 'Época', 'Modo', 'Resultado', 'Golos Equipa', 
                'Golos Adversários', 'Adversário', 'Jogadores', 'MVP'
            ];

            const matchRows = MATCHES_DATA
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(match => [
                    Utils.formatDate(match.date),
                    match.season,
                    match.mode,
                    match.result === 'win' ? 'Vitória' : 'Derrota',
                    match.goalsTeam,
                    match.goalsAgainst,
                    match.opponent || '-',
                    match.players.map(id => Utils.getPlayerTag(id)).join(', '),
                    match.mvp ? Utils.getPlayerTag(match.mvp) : '-'
                ]);

            Utils.exportToCSV('rl_stats_partidas', matchHeaders, matchRows);
        }, 500);

        Utils.showToast('Ficheiros CSV exportados com sucesso!', 'success');
    }
};

// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});