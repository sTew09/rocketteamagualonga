/**
 * ============================================
 * TEAM AGUA LONGA - Módulo de Páginas
 * ============================================
 * 
 * Funções para renderizar o conteúdo de cada página do dashboard.
 * Cada função retorna o HTML da página correspondente.
 */

const Pages = {

    /**
     * ============================================
     * PÁGINA: Dashboard (Página Inicial)
     * ============================================
     */
    dashboard() {
        const teamStats = Utils.getTeamStats();
        const allPlayersData = PLAYERS_DATA.map(player => ({
            ...player,
            stats: Utils.getPlayerStats(player.id)
        }));

        // Ordenar jogadores por total de golos
        const topScorer = [...allPlayersData].sort((a, b) => b.stats.totalGoals - a.stats.totalGoals)[0];
        const topAssist = [...allPlayersData].sort((a, b) => b.stats.totalAssists - a.stats.totalAssists)[0];
        const mostMVPs = [...allPlayersData].sort((a, b) => b.stats.mvps - a.stats.mvps)[0];

        // Partidas recentes (últimas 5)
        const recentMatches = [...MATCHES_DATA]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);

        const seasons = Utils.getSeasons(MATCHES_DATA);

        return `
            <div class="page-header">
                <div>
                    <h1><i class="fas fa-tachometer-alt" style="color: var(--primary); margin-right: 0.5rem;"></i>Dashboard</h1>
                    <p class="subtitle">Visão geral da equipa</p>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon orange"><i class="fas fa-gamepad"></i></div>
                    <div class="stat-value">${teamStats.totalGames}</div>
                    <div class="stat-label">Jogos Disputados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-trophy"></i></div>
                    <div class="stat-value">${teamStats.wins}</div>
                    <div class="stat-label">Vitórias</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><i class="fas fa-times-circle"></i></div>
                    <div class="stat-value">${teamStats.losses}</div>
                    <div class="stat-label">Derrotas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-percentage"></i></div>
                    <div class="stat-value">${teamStats.winRate}%</div>
                    <div class="stat-label">Taxa de Vitória</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-futbol"></i></div>
                    <div class="stat-value">${teamStats.totalGoalsFor}</div>
                    <div class="stat-label">Golos Marcados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><i class="fas fa-star"></i></div>
                    <div class="stat-value">${topScorer ? topScorer.stats.totalGoals : 0}</div>
                    <div class="stat-label">Top Marcador: ${topScorer ? topScorer.tag : '-'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-hand-holding-heart"></i></div>
                    <div class="stat-value">${topAssist ? topAssist.stats.totalAssists : 0}</div>
                    <div class="stat-label">Mais Assistências: ${topAssist ? topAssist.tag : '-'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow"><i class="fas fa-medal"></i></div>
                    <div class="stat-value">${mostMVPs ? mostMVPs.stats.mvps : 0}</div>
                    <div class="stat-label">Mais MVPs: ${mostMVPs ? mostMVPs.tag : '-'}</div>
                </div>
            </div>

            <!-- Charts -->
            <div class="charts-grid">
                <div class="chart-card">
                    <h3><i class="fas fa-chart-pie" style="color: var(--primary); margin-right: 0.5rem;"></i>Resultados da Equipa</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-win-loss-pie"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-chart-line" style="color: var(--primary); margin-right: 0.5rem;"></i>Evolução de Golos</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-goals-line"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-chart-bar" style="color: var(--primary); margin-right: 0.5rem;"></i>Vitórias vs Derrotas por Jogador</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-win-loss-bar"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-chart-line" style="color: var(--primary); margin-right: 0.5rem;"></i>Performance por Season</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-season-perf"></canvas>
                    </div>
                </div>
            </div>

            <!-- Recent Matches -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-clock" style="color: var(--primary); margin-right: 0.5rem;"></i>Partidas Recentes</h3>
                    <button class="btn btn-sm btn-ghost" onclick="App.navigate('matches')">
                        Ver Todas <i class="fas fa-arrow-right" style="margin-left: 0.25rem;"></i>
                    </button>
                </div>
                <div class="card-body no-padding">
                    ${recentMatches.map(match => this._matchItem(match)).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Inicializa os gráficos do dashboard
     */
    initDashboardCharts() {
        const teamStats = Utils.getTeamStats();
        const allPlayersData = PLAYERS_DATA.map(player => ({
            ...player,
            stats: Utils.getPlayerStats(player.id)
        }));
        const seasons = Utils.getSeasons(MATCHES_DATA);
        const sortedMatches = [...MATCHES_DATA].sort((a, b) => a.date.localeCompare(b.date));

        // Usar setTimeout para garantir que o DOM está pronto
        setTimeout(() => {
            Charts.createWinLossPie('chart-win-loss-pie', teamStats);
            Charts.createGoalsLine('chart-goals-line', sortedMatches);
            Charts.createWinLossBar('chart-win-loss-bar', allPlayersData);
            Charts.createSeasonPerformance('chart-season-perf', seasons);
        }, 100);
    },

    /**
     * ============================================
     * PÁGINA: Jogadores
     * ============================================
     */
    players() {
        const isAdmin = App.isAdmin;

        return `
            <div class="page-header">
                <div>
                    <h1><i class="fas fa-users" style="color: var(--primary); margin-right: 0.5rem;"></i>Jogadores</h1>
                    <p class="subtitle">${PLAYERS_DATA.length} jogadores na equipa</p>
                </div>
                ${isAdmin ? `
                    <button class="btn btn-primary" onclick="App.openPlayerModal()">
                        <i class="fas fa-plus"></i> Adicionar Jogador
                    </button>
                ` : ''}
            </div>

            <div class="players-grid">
                ${PLAYERS_DATA.map(player => {
                    const stats = Utils.getPlayerStats(player.id);
                    const roleLabel = player.role === 'captain' ? 'Capitão' : 
                                     player.role === 'sub' ? 'Suplente' : 'Jogador';
                    const roleIcon = player.role === 'captain' ? 'fa-crown' : 
                                    player.role === 'sub' ? 'fa-exchange-alt' : 'fa-user';
                    return `
                        <div class="player-card" onclick="App.showPlayerDetail('${player.id}')">
                            <div class="player-card-header">
                                <div class="player-avatar">${Utils.getInitials(player.name)}</div>
                                <div class="player-card-info">
                                    <h3>${player.name}</h3>
                                    <span class="player-tag">
                                        <i class="${roleIcon}" style="font-size: 0.75rem;"></i> 
                                        ${player.tag} · ${roleLabel}
                                    </span>
                                </div>
                            </div>
                            <div class="player-card-stats">
                                <div class="player-stat">
                                    <div class="value">${stats.totalGames}</div>
                                    <div class="label">Jogos</div>
                                </div>
                                <div class="player-stat">
                                    <div class="value">${stats.totalGoals}</div>
                                    <div class="label">Golos</div>
                                </div>
                                <div class="player-stat">
                                    <div class="value">${stats.totalAssists}</div>
                                    <div class="label">Assists</div>
                                </div>
                                <div class="player-stat">
                                    <div class="value">${stats.totalSaves}</div>
                                    <div class="label">Defesas</div>
                                </div>
                                <div class="player-stat">
                                    <div class="value">${stats.winRate}%</div>
                                    <div class="label">Win Rate</div>
                                </div>
                                <div class="player-stat">
                                    <div class="value">${stats.mvps}</div>
                                    <div class="label">MVPs</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * ============================================
     * PÁGINA: Detalhe do Jogador
     * ============================================
     */
    playerDetail(playerId) {
        const player = PLAYERS_DATA.find(p => p.id === playerId);
        if (!player) return '<div class="empty-state"><h3>Jogador não encontrado</h3></div>';

        const stats = Utils.getPlayerStats(playerId);
        const matches = Utils.filterMatches({ playerId });
        const roleLabel = player.role === 'captain' ? 'Capitão' : 
                         player.role === 'sub' ? 'Suplente' : 'Jogador';
        const platformIcons = {
            'PC': 'fa-desktop',
            'PS': 'fa-playstation',
            'Xbox': 'fa-xbox',
            'Switch': 'fa-gamepad'
        };

        return `
            <div class="page-header">
                <div>
                    <h1>
                        <button class="btn btn-icon" onclick="App.navigate('players')" style="margin-right: 0.5rem;">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        Detalhe do Jogador
                    </h1>
                </div>
                ${App.isAdmin ? `
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-ghost" onclick="App.openPlayerModal('${player.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="App.deletePlayer('${player.id}')">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- Player Header -->
            <div class="player-detail-header">
                <div class="player-detail-avatar">${Utils.getInitials(player.name)}</div>
                <div class="player-detail-info">
                    <h1>${player.name}</h1>
                    <div class="detail-row">
                        <span><i class="fas fa-tag"></i> ${player.tag}</span>
                        <span><i class="${platformIcons[player.platform] || 'fa-desktop'}"></i> ${player.platform}</span>
                        <span><i class="fas fa-id-badge"></i> ${roleLabel}</span>
                        <span><i class="fas fa-calendar"></i> Desde ${Utils.formatDateShort(player.joinDate)}</span>
                    </div>
                    ${player.rlId ? `<div class="detail-row"><span><i class="fas fa-gamepad"></i> ${player.rlId}</span></div>` : ''}
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon orange"><i class="fas fa-gamepad"></i></div>
                    <div class="stat-value">${stats.totalGames}</div>
                    <div class="stat-label">Jogos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-trophy"></i></div>
                    <div class="stat-value">${stats.wins} / ${stats.losses}</div>
                    <div class="stat-label">Vitórias / Derrotas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-percentage"></i></div>
                    <div class="stat-value">${stats.winRate}%</div>
                    <div class="stat-label">Taxa de Vitória</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-futbol"></i></div>
                    <div class="stat-value">${stats.totalGoals}</div>
                    <div class="stat-label">Golos (${stats.avgGoals}/jogo)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-hand-holding-heart"></i></div>
                    <div class="stat-value">${stats.totalAssists}</div>
                    <div class="stat-label">Assistências (${stats.avgAssists}/jogo)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><i class="fas fa-shield-alt"></i></div>
                    <div class="stat-value">${stats.totalSaves}</div>
                    <div class="stat-label">Defesas (${stats.avgSaves}/jogo)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow"><i class="fas fa-medal"></i></div>
                    <div class="stat-value">${stats.mvps}</div>
                    <div class="stat-label">MVPs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><i class="fas fa-crosshairs"></i></div>
                    <div class="stat-value">${stats.shotAccuracy}%</div>
                    <div class="stat-label">Precisão (${stats.totalShots} remates)</div>
                </div>
            </div>

            <!-- Charts -->
            <div class="charts-grid">
                <div class="chart-card">
                    <h3><i class="fas fa-spider" style="color: var(--primary); margin-right: 0.5rem;"></i>Perfil de Habilidades</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-player-radar"></canvas>
                    </div>
                </div>
            </div>

            <!-- Match History for Player -->
            <div class="card mt-2">
                <div class="card-header">
                    <h3><i class="fas fa-history" style="color: var(--primary); margin-right: 0.5rem;"></i>Histórico de Partidas</h3>
                </div>
                <div class="card-body no-padding">
                    ${matches.length > 0 
                        ? matches.map(match => this._matchItem(match)).join('')
                        : '<div class="empty-state"><i class="fas fa-gamepad"></i><h3>Sem partidas registadas</h3></div>'
                    }
                </div>
            </div>
        `;
    },

    /**
     * Inicializa gráficos da página de detalhe do jogador
     * @param {string} playerId - ID do jogador
     */
    initPlayerDetailCharts(playerId) {
        const player = PLAYERS_DATA.find(p => p.id === playerId);
        if (!player) return;

        const stats = Utils.getPlayerStats(playerId);

        setTimeout(() => {
            Charts.createPlayerRadar('chart-player-radar', stats, player.name);
        }, 100);
    },

    /**
     * ============================================
     * PÁGINA: Partidas
     * ============================================
     */
    matches() {
        const seasons = Utils.getSeasons(MATCHES_DATA);
        const matches = Utils.filterMatches(App.currentFilters);

        return `
            <div class="page-header">
                <div>
                    <h1><i class="fas fa-gamepad" style="color: var(--primary); margin-right: 0.5rem;"></i>Partidas</h1>
                    <p class="subtitle">${MATCHES_DATA.length} partidas registadas</p>
                </div>
                ${App.isAdmin ? `
                    <button class="btn btn-primary" onclick="App.openMatchModal()">
                        <i class="fas fa-plus"></i> Adicionar Partida
                    </button>
                ` : ''}
            </div>

            <!-- Filters -->
            <div class="filters-bar">
                <div class="filter-group">
                    <label>Época:</label>
                    <select onchange="App.setFilter('season', this.value)">
                        <option value="all">Todas</option>
                        ${seasons.map(s => `<option value="${s}" ${App.currentFilters.season === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Modo:</label>
                    <select onchange="App.setFilter('mode', this.value)">
                        <option value="all">Todos</option>
                        <option value="3v3" ${App.currentFilters.mode === '3v3' ? 'selected' : ''}>3v3</option>
                        <option value="2v2" ${App.currentFilters.mode === '2v2' ? 'selected' : ''}>2v2</option>
                        <option value="1v1" ${App.currentFilters.mode === '1v1' ? 'selected' : ''}>1v1</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Resultado:</label>
                    <select onchange="App.setFilter('result', this.value)">
                        <option value="all">Todos</option>
                        <option value="win" ${App.currentFilters.result === 'win' ? 'selected' : ''}>Vitórias</option>
                        <option value="loss" ${App.currentFilters.result === 'loss' ? 'selected' : ''}>Derrotas</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>De:</label>
                    <input type="date" value="${App.currentFilters.dateFrom || ''}" 
                           onchange="App.setFilter('dateFrom', this.value)">
                </div>
                <div class="filter-group">
                    <label>Até:</label>
                    <input type="date" value="${App.currentFilters.dateTo || ''}" 
                           onchange="App.setFilter('dateTo', this.value)">
                </div>
            </div>

            <!-- Matches List -->
            <div class="card">
                <div class="card-body no-padding">
                    ${matches.length > 0 
                        ? matches.map(match => this._matchItem(match, true)).join('')
                        : '<div class="empty-state"><i class="fas fa-gamepad"></i><h3>Nenhuma partida encontrada</h3><p>Ajuste os filtros ou adicione novas partidas.</p></div>'
                    }
                </div>
            </div>
        `;
    },

    /**
     * ============================================
     * PÁGINA: Rankings
     * ============================================
     */
    rankings() {
        const allPlayersData = PLAYERS_DATA.map(player => ({
            ...player,
            stats: Utils.getPlayerStats(player.id)
        }));

        // Rankings por diferentes critérios
        const byGoals = [...allPlayersData].sort((a, b) => b.stats.totalGoals - a.stats.totalGoals);
        const byAssists = [...allPlayersData].sort((a, b) => b.stats.totalAssists - a.stats.totalAssists);
        const byWinRate = [...allPlayersData].sort((a, b) => b.stats.winRate - a.stats.winRate);
        const byMVPs = [...allPlayersData].sort((a, b) => b.stats.mvps - a.stats.mvps);
        const bySaves = [...allPlayersData].sort((a, b) => b.stats.totalSaves - a.stats.totalSaves);
        const byAvgGoals = [...allPlayersData]
            .filter(p => p.stats.totalGames >= 3)
            .sort((a, b) => b.stats.avgGoals - a.stats.avgGoals);

        return `
            <div class="page-header">
                <div>
                    <h1><i class="fas fa-trophy" style="color: var(--primary); margin-right: 0.5rem;"></i>Rankings</h1>
                    <p class="subtitle">Classificações dos jogadores</p>
                </div>
            </div>

            <div class="charts-grid" style="grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));">
                <!-- Top Marcadores -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-futbol" style="color: var(--primary); margin-right: 0.5rem;"></i>Top Marcadores</h3>
                    </div>
                    <div class="card-body no-padding">
                        <div class="ranking-list">
                            ${byGoals.map((p, i) => this._rankingItem(i, p, 'totalGoals', 'Golos')).join('')}
                        </div>
                    </div>
                </div>

                <!-- Mais Assistências -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-hand-holding-heart" style="color: var(--secondary); margin-right: 0.5rem;"></i>Melhores Assistências</h3>
                    </div>
                    <div class="card-body no-padding">
                        <div class="ranking-list">
                            ${byAssists.map((p, i) => this._rankingItem(i, p, 'totalAssists', 'Assists')).join('')}
                        </div>
                    </div>
                </div>

                <!-- Melhor Win Rate -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-percentage" style="color: var(--success); margin-right: 0.5rem;"></i>Melhor Win Rate</h3>
                    </div>
                    <div class="card-body no-padding">
                        <div class="ranking-list">
                            ${byWinRate.map((p, i) => this._rankingItem(i, p, 'winRate', 'Win %', '%')).join('')}
                        </div>
                    </div>
                </div>

                <!-- Mais MVPs -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-medal" style="color: var(--warning); margin-right: 0.5rem;"></i>Mais MVPs</h3>
                    </div>
                    <div class="card-body no-padding">
                        <div class="ranking-list">
                            ${byMVPs.map((p, i) => this._rankingItem(i, p, 'mvps', 'MVPs')).join('')}
                        </div>
                    </div>
                </div>

                <!-- Mais Defesas -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-shield-alt" style="color: var(--purple); margin-right: 0.5rem;"></i>Melhores Defensores</h3>
                    </div>
                    <div class="card-body no-padding">
                        <div class="ranking-list">
                            ${bySaves.map((p, i) => this._rankingItem(i, p, 'totalSaves', 'Defesas')).join('')}
                        </div>
                    </div>
                </div>

                <!-- Melhor Média de Golos -->
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-line" style="color: var(--error); margin-right: 0.5rem;"></i>Melhor Média Golos/Jogo</h3>
                    </div>
                    <div class="card-body no-padding">
                        <div class="ranking-list">
                            ${byAvgGoals.length > 0 
                                ? byAvgGoals.map((p, i) => this._rankingItem(i, p, 'avgGoals', 'Golos/Jogo')).join('')
                                : '<div class="empty-state" style="padding: 2rem;"><p>Jogadores precisam de mais partidas</p></div>'
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="charts-grid mt-3">
                <div class="chart-card">
                    <h3><i class="fas fa-chart-bar" style="color: var(--primary); margin-right: 0.5rem;"></i>Top Marcadores</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-top-scorers"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-chart-bar" style="color: var(--secondary); margin-right: 0.5rem;"></i>Assistências por Jogador</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-assists"></canvas>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Inicializa gráficos da página de rankings
     */
    initRankingsCharts() {
        const allPlayersData = PLAYERS_DATA.map(player => ({
            ...player,
            stats: Utils.getPlayerStats(player.id)
        }));

        const byGoals = [...allPlayersData].sort((a, b) => b.stats.totalGoals - a.stats.totalGoals);
        const byAssists = [...allPlayersData].sort((a, b) => b.stats.totalAssists - a.stats.totalAssists);

        setTimeout(() => {
            Charts.createTopScorersBar('chart-top-scorers', byGoals);
            Charts.createAssistsBar('chart-assists', byAssists);
        }, 100);
    },

    /**
     * ============================================
     * PÁGINA: Estatísticas
     * ============================================
     */
    statistics() {
        const seasons = Utils.getSeasons(MATCHES_DATA);
        const teamStats = Utils.getTeamStats();

        // Stats por modo de jogo
        const modes = ['3v3', '2v2', '1v1'];
        const modeStats = modes.map(mode => {
            const matches = MATCHES_DATA.filter(m => m.mode === mode);
            return {
                mode,
                ...Utils.getTeamStats(matches)
            };
        }).filter(m => m.totalGames > 0);

        // Stats por adversário
        const opponents = [...new Set(MATCHES_DATA.map(m => m.opponent))];
        const opponentStats = opponents.map(opp => {
            const matches = MATCHES_DATA.filter(m => m.opponent === opp);
            const wins = matches.filter(m => m.result === 'win').length;
            return {
                opponent: opp,
                games: matches.length,
                wins,
                losses: matches.length - wins,
                winRate: parseFloat(Utils.calcWinRate(wins, matches.length)),
                goalsFor: matches.reduce((sum, m) => sum + m.goalsTeam, 0),
                goalsAgainst: matches.reduce((sum, m) => sum + m.goalsAgainst, 0)
            };
        }).sort((a, b) => b.games - a.games);

        return `
            <div class="page-header">
                <div>
                    <h1><i class="fas fa-chart-bar" style="color: var(--primary); margin-right: 0.5rem;"></i>Estatísticas</h1>
                    <p class="subtitle">Análise detalhada de desempenho</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-success" onclick="App.syncToGitHub()">
                        <i class="fas fa-cloud-upload-alt"></i> Guardar Dados
                    </button>
                    <button class="btn btn-primary" onclick="App.exportAllCSV()">
                        <i class="fas fa-file-csv"></i> Exportar CSV
                    </button>
                </div>
            </div>

            <!-- Team Stats Overview -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon orange"><i class="fas fa-futbol"></i></div>
                    <div class="stat-value">${teamStats.avgGoalsFor}</div>
                    <div class="stat-label">Média Golos/Jogo</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><i class="fas fa-shield-alt"></i></div>
                    <div class="stat-value">${teamStats.avgGoalsAgainst}</div>
                    <div class="stat-label">Média Golos Sofridos/Jogo</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-plus-minus"></i></div>
                    <div class="stat-value">${teamStats.goalDifference > 0 ? '+' : ''}${teamStats.goalDifference}</div>
                    <div class="stat-label">Diferença de Golos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                    <div class="stat-value">${PLAYERS_DATA.length}</div>
                    <div class="stat-label">Jogadores Ativos</div>
                </div>
            </div>

            <!-- Game Modes Stats -->
            <div class="card mb-3">
                <div class="card-header">
                    <h3><i class="fas fa-layer-group" style="color: var(--primary); margin-right: 0.5rem;"></i>Estatísticas por Modo de Jogo</h3>
                </div>
                <div class="card-body no-padding">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Modo</th>
                                    <th>Jogos</th>
                                    <th>Vitórias</th>
                                    <th>Derrotas</th>
                                    <th>Win Rate</th>
                                    <th>Golos Marcados</th>
                                    <th>Golos Sofridos</th>
                                    <th>Média Golos/Jogo</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${modeStats.map(m => `
                                    <tr>
                                        <td><strong>${m.mode}</strong></td>
                                        <td>${m.totalGames}</td>
                                        <td class="text-success">${m.wins}</td>
                                        <td class="text-error">${m.losses}</td>
                                        <td>
                                            <span class="badge ${m.winRate >= 50 ? 'badge-win' : 'badge-loss'}">
                                                ${m.winRate}%
                                            </span>
                                        </td>
                                        <td>${m.totalGoalsFor}</td>
                                        <td>${m.totalGoalsAgainst}</td>
                                        <td>${m.avgGoalsFor}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Opponent Stats -->
            <div class="card mb-3">
                <div class="card-header">
                    <h3><i class="fas fa-flag" style="color: var(--primary); margin-right: 0.5rem;"></i>Estatísticas por Adversário</h3>
                </div>
                <div class="card-body no-padding">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Adversário</th>
                                    <th>Jogos</th>
                                    <th>Vitórias</th>
                                    <th>Derrotas</th>
                                    <th>Win Rate</th>
                                    <th>Golos</th>
                                    <th>Golos Sofridos</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${opponentStats.map(o => `
                                    <tr>
                                        <td><strong>${o.opponent}</strong></td>
                                        <td>${o.games}</td>
                                        <td class="text-success">${o.wins}</td>
                                        <td class="text-error">${o.losses}</td>
                                        <td>
                                            <span class="badge ${o.winRate >= 50 ? 'badge-win' : 'badge-loss'}">
                                                ${o.winRate}%
                                            </span>
                                        </td>
                                        <td>${o.goalsFor}</td>
                                        <td>${o.goalsAgainst}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Complete Player Stats Table -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-table" style="color: var(--primary); margin-right: 0.5rem;"></i>Estatísticas Completas dos Jogadores</h3>
                </div>
                <div class="card-body no-padding">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Jogador</th>
                                    <th>Jogos</th>
                                    <th>V</th>
                                    <th>D</th>
                                    <th>Win%</th>
                                    <th>Golos</th>
                                    <th>Assists</th>
                                    <th>Defesas</th>
                                    <th>Remates</th>
                                    <th>% Precisão</th>
                                    <th>Média G/J</th>
                                    <th>Média A/J</th>
                                    <th>MVPs</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${PLAYERS_DATA.map(player => {
                                    const stats = Utils.getPlayerStats(player.id);
                                    return `
                                        <tr onclick="App.showPlayerDetail('${player.id}')" style="cursor: pointer;">
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                    <div class="player-avatar" style="width: 32px; height: 32px; font-size: 0.75rem;">
                                                        ${Utils.getInitials(player.name)}
                                                    </div>
                                                    <div>
                                                        <div style="font-weight: 600;">${player.name}</div>
                                                        <div style="font-size: 0.75rem; color: var(--text-muted);">${player.tag}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${stats.totalGames}</td>
                                            <td class="text-success">${stats.wins}</td>
                                            <td class="text-error">${stats.losses}</td>
                                            <td>
                                                <span class="badge ${stats.winRate >= 50 ? 'badge-win' : 'badge-loss'}">
                                                    ${stats.winRate}%
                                                </span>
                                            </td>
                                            <td><strong>${stats.totalGoals}</strong></td>
                                            <td>${stats.totalAssists}</td>
                                            <td>${stats.totalSaves}</td>
                                            <td>${stats.totalShots}</td>
                                            <td>${stats.shotAccuracy}%</td>
                                            <td>${stats.avgGoals}</td>
                                            <td>${stats.avgAssists}</td>
                                            <td>
                                                ${stats.mvps > 0 ? `<span class="badge badge-mvp">${stats.mvps}</span>` : '0'}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * ============================================
     * COMPONENTES REUTILIZÁVEIS
     * ============================================
     */

    /**
     * Renderiza um item de partida (componente reutilizável)
     * @param {Object} match - Dados da partida
     * @param {boolean} showActions - Mostrar botões de ação (admin)
     * @returns {string} HTML do item
     */
    _matchItem(match, showActions = false) {
        const isWin = match.result === 'win';
        const playerNames = match.players.map(id => Utils.getPlayerTag(id)).join(', ');
        const mvpName = match.mvp ? Utils.getPlayerTag(match.mvp) : null;

        return `
            <div class="match-item">
                <div class="match-result-indicator ${isWin ? 'win' : 'loss'}"></div>
                <div class="match-info">
                    <div class="match-date">${Utils.formatDate(match.date)} · ${match.mode} · ${match.season}</div>
                    <div class="match-teams">
                        Nossa Equipa vs ${match.opponent || '???'}
                    </div>
                    <div class="match-meta">
                        <i class="fas fa-users" style="font-size: 0.7rem;"></i> ${playerNames}
                        ${mvpName ? ` · <span class="badge badge-mvp"><i class="fas fa-medal"></i> MVP: ${mvpName}</span>` : ''}
                    </div>
                </div>
                <div class="match-score">
                    <div class="score ${isWin ? 'text-success' : 'text-error'}">${match.goalsTeam} - ${match.goalsAgainst}</div>
                    <span class="badge ${isWin ? 'badge-win' : 'badge-loss'}" style="font-size: 0.65rem;">
                        ${isWin ? 'VITÓRIA' : 'DERROTA'}
                    </span>
                </div>
                ${showActions && App.isAdmin ? `
                    <div class="match-actions">
                        <button class="btn btn-icon" onclick="event.stopPropagation(); App.openMatchModal('${match.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" onclick="event.stopPropagation(); App.deleteMatch('${match.id}')" title="Remover" style="color: var(--error);">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Renderiza um item de ranking (componente reutilizável)
     * @param {number} index - Posição no ranking (0-based)
     * @param {Object} player - Dados do jogador
     * @param {string} statKey - Chave da estatística a mostrar
     * @param {string} statLabel - Label da estatística
     * @param {string} suffix - Sufixo opcional (ex: '%')
     * @returns {string} HTML do item
     */
    _rankingItem(index, player, statKey, statLabel, suffix = '') {
        const medals = ['🥇', '🥈', '🥉'];
        const positionDisplay = index < 3 ? medals[index] : `${index + 1}`;

        return `
            <div class="ranking-item" onclick="App.showPlayerDetail('${player.id}')" style="cursor: pointer;">
                <div class="ranking-position">${positionDisplay}</div>
                <div class="player-avatar" style="width: 40px; height: 40px; font-size: 1rem;">
                    ${Utils.getInitials(player.name)}
                </div>
                <div class="ranking-player-info">
                    <h3>${player.name}</h3>
                    <span>${player.tag}</span>
                </div>
                <div class="ranking-stats">
                    <div class="ranking-stat">
                        <div class="value">${player.stats[statKey]}${suffix}</div>
                        <div class="label">${statLabel}</div>
                    </div>
                </div>
            </div>
        `;
    }
};
