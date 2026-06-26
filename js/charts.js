/**
 * ============================================
 * TEAM AGUA LONGA - Módulo de Gráficos
 * ============================================
 * 
 * Funções para criar e gerir gráficos interativos usando Chart.js.
 */

const Charts = {

    // Armazena instâncias de gráficos para destruir antes de recriar
    instances: {},

    /**
     * Obtém cores do tema atual
     * @returns {Object} Cores do tema
     */
    getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        return {
            text: style.getPropertyValue('--text-primary').trim(),
            textSecondary: style.getPropertyValue('--text-secondary').trim(),
            textMuted: style.getPropertyValue('--text-muted').trim(),
            border: style.getPropertyValue('--border').trim(),
            primary: '#f97316',
            success: '#22c55e',
            error: '#ef4444',
            warning: '#eab308',
            secondary: '#3b82f6',
            purple: '#a855f7',
            bg: style.getPropertyValue('--bg-card').trim()
        };
    },

    /**
     * Destrói um gráfico existente antes de criar novo
     * @param {string} canvasId - ID do canvas
     */
    destroy(canvasId) {
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
            delete this.instances[canvasId];
        }
    },

    /**
     * Configuração base para todos os gráficos
     * @returns {Object} Configuração base
     */
    getBaseOptions() {
        const colors = this.getThemeColors();
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: colors.textSecondary,
                        font: { family: "'Segoe UI', sans-serif", size: 12 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: '#334155',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: { weight: '600' }
                }
            }
        };
    },

    /**
     * Cria gráfico de barras (Vitórias vs Derrotas por jogador)
     * @param {string} canvasId - ID do elemento canvas
     * @param {Array} playersData - Dados dos jogadores
     */
    createWinLossBar(canvasId, playersData) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const colors = this.getThemeColors();

        this.instances[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: playersData.map(p => p.tag),
                datasets: [
                    {
                        label: 'Vitórias',
                        data: playersData.map(p => p.stats.wins),
                        backgroundColor: colors.success + '80',
                        borderColor: colors.success,
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Derrotas',
                        data: playersData.map(p => p.stats.losses),
                        backgroundColor: colors.error + '80',
                        borderColor: colors.error,
                        borderWidth: 2,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                ...this.getBaseOptions(),
                scales: {
                    x: {
                        ticks: { color: colors.textSecondary },
                        grid: { color: colors.border + '40' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: colors.textSecondary, stepSize: 1 },
                        grid: { color: colors.border + '40' }
                    }
                }
            }
        });
    },

    /**
     * Cria gráfico de pizza (Distribuição de resultados da equipa)
     * @param {string} canvasId - ID do elemento canvas
     * @param {Object} teamStats - Estatísticas da equipa
     */
    createWinLossPie(canvasId, teamStats) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        this.instances[canvasId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Vitórias', 'Derrotas'],
                datasets: [{
                    data: [teamStats.wins, teamStats.losses],
                    backgroundColor: ['#22c55e80', '#ef444480'],
                    borderColor: ['#22c55e', '#ef4444'],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                ...this.getBaseOptions(),
                cutout: '65%',
                plugins: {
                    ...this.getBaseOptions().plugins,
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.getThemeColors().textSecondary,
                            font: { family: "'Segoe UI', sans-serif", size: 13 },
                            padding: 20,
                            usePointStyle: true,
                            pointStyleWidth: 12
                        }
                    }
                }
            }
        });
    },

    /**
     * Cria gráfico de linha (Evolução de golos ao longo das partidas)
     * @param {string} canvasId - ID do elemento canvas
     * @param {Array} matches - Partidas ordenadas por data
     */
    createGoalsLine(canvasId, matches) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const sortedMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date));
        const colors = this.getThemeColors();

        // Média móvel de 3 jogos
        const goalsFor = sortedMatches.map(m => m.goalsTeam);
        const goalsAgainst = sortedMatches.map(m => m.goalsAgainst);
        const movingAvgFor = goalsFor.map((_, i, arr) => {
            const slice = arr.slice(Math.max(0, i - 2), i + 1);
            return parseFloat((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2));
        });

        this.instances[canvasId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: sortedMatches.map((m, i) => `J${i + 1}`),
                datasets: [
                    {
                        label: 'Golos Marcados',
                        data: goalsFor,
                        borderColor: colors.success,
                        backgroundColor: colors.success + '20',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Golos Sofridos',
                        data: goalsAgainst,
                        borderColor: colors.error,
                        backgroundColor: colors.error + '20',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Média Móvel (3j)',
                        data: movingAvgFor,
                        borderColor: colors.primary,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                ...this.getBaseOptions(),
                scales: {
                    x: {
                        ticks: { color: colors.textSecondary },
                        grid: { color: colors.border + '40' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: colors.textSecondary, stepSize: 1 },
                        grid: { color: colors.border + '40' }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },

    /**
     * Cria gráfico de radar (Perfil de habilidades de um jogador)
     * @param {string} canvasId - ID do elemento canvas
     * @param {Object} stats - Estatísticas do jogador
     * @param {string} label - Nome do jogador
     */
    createPlayerRadar(canvasId, stats, label) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const colors = this.getThemeColors();

        this.instances[canvasId] = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: ['Golos', 'Assistências', 'Defesas', 'Remates', 'MVPs', '% Vitórias'],
                datasets: [{
                    label: label,
                    data: [
                        stats.totalGoals,
                        stats.totalAssists,
                        stats.totalSaves,
                        stats.totalShots,
                        stats.mvps * 5, // Escalar MVPs para visualização
                        stats.winRate
                    ],
                    backgroundColor: colors.primary + '30',
                    borderColor: colors.primary,
                    borderWidth: 2,
                    pointBackgroundColor: colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...this.getBaseOptions(),
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            color: colors.textMuted,
                            backdropColor: 'transparent',
                            font: { size: 10 }
                        },
                        grid: { color: colors.border + '60' },
                        pointLabels: {
                            color: colors.textSecondary,
                            font: { family: "'Segoe UI', sans-serif", size: 12 }
                        }
                    }
                },
                plugins: {
                    ...this.getBaseOptions().plugins,
                    legend: { display: false }
                }
            }
        });
    },

    /**
     * Cria gráfico de barras horizontais (Top marcadores)
     * @param {string} canvasId - ID do elemento canvas
     * @param {Array} playersData - Dados dos jogadores ordenados por golos
     */
    createTopScorersBar(canvasId, playersData) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const colors = this.getThemeColors();
        const topPlayers = playersData.slice(0, 8);
        const playerColors = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];

        this.instances[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: topPlayers.map(p => p.tag),
                datasets: [{
                    label: 'Golos',
                    data: topPlayers.map(p => p.stats.totalGoals),
                    backgroundColor: topPlayers.map((_, i) => playerColors[i % playerColors.length] + '80'),
                    borderColor: topPlayers.map((_, i) => playerColors[i % playerColors.length]),
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                ...this.getBaseOptions(),
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: colors.textSecondary, stepSize: 1 },
                        grid: { color: colors.border + '40' }
                    },
                    y: {
                        ticks: { color: colors.textSecondary },
                        grid: { display: false }
                    }
                },
                plugins: {
                    ...this.getBaseOptions().plugins,
                    legend: { display: false }
                }
            }
        });
    },

    /**
     * Cria gráfico de barras (Assistências por jogador)
     * @param {string} canvasId - ID do elemento canvas
     * @param {Array} playersData - Dados dos jogadores
     */
    createAssistsBar(canvasId, playersData) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const colors = this.getThemeColors();

        this.instances[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: playersData.map(p => p.tag),
                datasets: [{
                    label: 'Assistências',
                    data: playersData.map(p => p.stats.totalAssists),
                    backgroundColor: colors.secondary + '80',
                    borderColor: colors.secondary,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                ...this.getBaseOptions(),
                scales: {
                    x: {
                        ticks: { color: colors.textSecondary },
                        grid: { color: colors.border + '40' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: colors.textSecondary, stepSize: 1 },
                        grid: { color: colors.border + '40' }
                    }
                },
                plugins: {
                    ...this.getBaseOptions().plugins,
                    legend: { display: false }
                }
            }
        });
    },

    /**
     * Cria gráfico de linha (Performance ao longo das seasons)
     * @param {string} canvasId - ID do elemento canvas
     * @param {Array} seasons - Lista de seasons
     */
    createSeasonPerformance(canvasId, seasons) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const colors = this.getThemeColors();
        const seasonData = seasons.map(season => {
            const matches = MATCHES_DATA.filter(m => m.season === season);
            const stats = Utils.getTeamStats(matches);
            return { season, ...stats };
        }).reverse();

        this.instances[canvasId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: seasonData.map(s => s.season),
                datasets: [
                    {
                        label: 'Win Rate (%)',
                        data: seasonData.map(s => s.winRate),
                        borderColor: colors.primary,
                        backgroundColor: colors.primary + '20',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: colors.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Golos por Jogo',
                        data: seasonData.map(s => s.avgGoalsFor),
                        borderColor: colors.success,
                        backgroundColor: colors.success + '20',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: colors.success,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...this.getBaseOptions(),
                scales: {
                    x: {
                        ticks: { color: colors.textSecondary },
                        grid: { color: colors.border + '40' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        ticks: { 
                            color: colors.primary,
                            callback: v => v + '%'
                        },
                        grid: { color: colors.border + '40' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        ticks: { color: colors.success },
                        grid: { drawOnChartArea: false }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },

    /**
     * Cria gráfico de polar area (Modos de jogo)
     * @param {string} canvasId - ID do elemento canvas
     * @param {Array} matches - Partidas
     */
    createGameModesPolar(canvasId, matches) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const colors = this.getThemeColors();
        const modes = ['3v3', '2v2', '1v1'];
        const modeCounts = modes.map(mode => matches.filter(m => m.mode === mode).length);
        const modeWins = modes.map(mode => 
            matches.filter(m => m.mode === mode && m.result === 'win').length
        );

        this.instances[canvasId] = new Chart(canvas, {
            type: 'polarArea',
            data: {
                labels: modes.map((m, i) => `${m} (${modeCounts[i]} jogos)`),
                datasets: [{
                    data: modeWins,
                    backgroundColor: [
                        colors.primary + '60',
                        colors.secondary + '60',
                        colors.purple + '60'
                    ],
                    borderColor: ['#f97316', '#3b82f6', '#a855f7'],
                    borderWidth: 2
                }]
            },
            options: {
                ...this.getBaseOptions(),
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            color: colors.textMuted,
                            backdropColor: 'transparent',
                            stepSize: 1
                        },
                        grid: { color: colors.border + '40' }
                    }
                },
                plugins: {
                    ...this.getBaseOptions().plugins,
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.textSecondary,
                            font: { size: 12 },
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    },

    /**
     * Destrói todos os gráficos (útil ao mudar de página)
     */
    destroyAll() {
        Object.keys(this.instances).forEach(key => {
            this.destroy(key);
        });
    }
};
