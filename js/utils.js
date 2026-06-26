/**
 * ============================================
 * TEAM AGUA LONGA - Funções de Utilidade
 * ============================================
 * 
 * Funções auxiliares usadas em todo o projeto.
 */

const Utils = {

    /**
     * Formata uma data para o formato DD/MM/YYYY
     * @param {string} dateStr - Data no formato YYYY-MM-DD
     * @returns {string} Data formatada
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    },

    /**
     * Formata uma data para formato abreviado (Ex: 5 Set 2024)
     * @param {string} dateStr - Data no formato YYYY-MM-DD
     * @returns {string} Data formatada
     */
    formatDateShort(dateStr) {
        if (!dateStr) return '-';
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const [year, month, day] = dateStr.split('-');
        return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
    },

    /**
     * Calcula a percentagem de vitórias
     * @param {number} wins - Vitórias
     * @param {number} total - Total de jogos
     * @returns {string} Percentagem formatada
     */
    calcWinRate(wins, total) {
        if (total === 0) return '0.0';
        return ((wins / total) * 100).toFixed(1);
    },

    /**
     * Calcula a média de um valor por jogos
     * @param {number} value - Valor total
     * @param {number} games - Número de jogos
     * @returns {string} Média formatada a 2 casas decimais
     */
    calcAverage(value, games) {
        if (games === 0) return '0.00';
        return (value / games).toFixed(2);
    },

    /**
     * Gera um ID único simples
     * @returns {string} ID único
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Obtém o nome de um jogador pelo ID
     * @param {string} playerId - ID do jogador
     * @returns {string} Nome do jogador
     */
    getPlayerName(playerId) {
        const player = PLAYERS_DATA.find(p => p.id === playerId);
        return player ? player.name : 'Desconhecido';
    },

    /**
     * Obtém a tag de um jogador pelo ID
     * @param {string} playerId - ID do jogador
     * @returns {string} Tag do jogador
     */
    getPlayerTag(playerId) {
        const player = PLAYERS_DATA.find(p => p.id === playerId);
        return player ? player.tag : '???';
    },

    /**
     * Obtém as iniciais de um jogador
     * @param {string} name - Nome completo
     * @returns {string} Iniciais (máximo 2 caracteres)
     */
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    },

    /**
     * Obtém todas as seasons disponíveis
     * @param {Array} matches - Array de partidas
     * @returns {Array} Lista de seasons ordenadas
     */
    getSeasons(matches) {
        const seasons = [...new Set(matches.map(m => m.season))];
        return seasons.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numB - numA;
        });
    },

    /**
     * Filtra partidas por criteria
     * @param {Object} filters - Filtros a aplicar
     * @returns {Array} Partidas filtradas
     */
    filterMatches(filters = {}) {
        let result = [...MATCHES_DATA];

        if (filters.season && filters.season !== 'all') {
            result = result.filter(m => m.season === filters.season);
        }

        if (filters.mode && filters.mode !== 'all') {
            result = result.filter(m => m.mode === filters.mode);
        }

        if (filters.result && filters.result !== 'all') {
            result = result.filter(m => m.result === filters.result);
        }

        if (filters.playerId) {
            result = result.filter(m => m.players.includes(filters.playerId));
        }

        if (filters.dateFrom) {
            result = result.filter(m => m.date >= filters.dateFrom);
        }

        if (filters.dateTo) {
            result = result.filter(m => m.date <= filters.dateTo);
        }

        // Ordenar por data (mais recente primeiro)
        result.sort((a, b) => b.date.localeCompare(a.date));

        return result;
    },

    /**
     * Calcula estatísticas agregadas de um jogador
     * @param {string} playerId - ID do jogador
     * @param {Array} matches - Array de partidas (opcional, usa todas se não especificado)
     * @returns {Object} Estatísticas calculadas
     */
    getPlayerStats(playerId, matches = null) {
        if (!matches) {
            matches = MATCHES_DATA.filter(m => m.players.includes(playerId));
        } else {
            matches = matches.filter(m => m.players.includes(playerId));
        }

        const totalGames = matches.length;
        const wins = matches.filter(m => m.result === 'win').length;
        const losses = totalGames - wins;

        let totalGoals = 0;
        let totalAssists = 0;
        let totalSaves = 0;
        let totalShots = 0;
        let mvps = 0;

        matches.forEach(match => {
            const stats = match.playerStats[playerId];
            if (stats) {
                totalGoals += stats.goals || 0;
                totalAssists += stats.assists || 0;
                totalSaves += stats.saves || 0;
                totalShots += stats.shots || 0;
            }
            if (match.mvp === playerId) {
                mvps++;
            }
        });

        return {
            totalGames,
            wins,
            losses,
            winRate: parseFloat(this.calcWinRate(wins, totalGames)),
            totalGoals,
            totalAssists,
            totalSaves,
            totalShots,
            avgGoals: parseFloat(this.calcAverage(totalGoals, totalGames)),
            avgAssists: parseFloat(this.calcAverage(totalAssists, totalGames)),
            avgSaves: parseFloat(this.calcAverage(totalSaves, totalGames)),
            avgShots: parseFloat(this.calcAverage(totalShots, totalGames)),
            shotAccuracy: totalShots > 0 ? parseFloat(((totalGoals / totalShots) * 100).toFixed(1)) : 0,
            mvps
        };
    },

    /**
     * Calcula estatísticas agregadas da equipa
     * @param {Array} matches - Array de partidas
     * @returns {Object} Estatísticas da equipa
     */
    getTeamStats(matches = null) {
        if (!matches) matches = MATCHES_DATA;

        const totalGames = matches.length;
        const wins = matches.filter(m => m.result === 'win').length;
        const losses = totalGames - wins;

        let totalGoalsFor = 0;
        let totalGoalsAgainst = 0;

        matches.forEach(match => {
            totalGoalsFor += match.goalsTeam || 0;
            totalGoalsAgainst += match.goalsAgainst || 0;
        });

        return {
            totalGames,
            wins,
            losses,
            winRate: parseFloat(this.calcWinRate(wins, totalGames)),
            totalGoalsFor,
            totalGoalsAgainst,
            goalDifference: totalGoalsFor - totalGoalsAgainst,
            avgGoalsFor: parseFloat(this.calcAverage(totalGoalsFor, totalGames)),
            avgGoalsAgainst: parseFloat(this.calcAverage(totalGoalsAgainst, totalGames))
        };
    },

    /**
     * Exporta dados para CSV
     * @param {string} filename - Nome do ficheiro
     * @param {Array} headers - Cabeçalhos das colunas
     * @param {Array} rows - Linhas de dados
     */
    exportToCSV(filename, headers, rows) {
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Escapar vírgulas e aspas
                const str = String(cell);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    /**
     * Mostra uma notificação toast
     * @param {string} message - Mensagem a mostrar
     * @param {string} type - Tipo (success, error, info)
     * @param {number} duration - Duração em ms
     */
    showToast(message, type = 'info', duration = 3000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Confirma uma ação com o utilizador
     * @param {string} message - Mensagem de confirmação
     * @returns {boolean} true se confirmou
     */
    confirm(message) {
        return window.confirm(message);
    },

    /**
     * Debounce - limita a frequência de execução de uma função
     * @param {Function} func - Função a executar
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função debounced
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};