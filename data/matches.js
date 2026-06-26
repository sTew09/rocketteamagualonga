/**
 * ============================================
 * TEAM AGUA LONGA - Dados das Partidas
 * ============================================
 * 
 * Este ficheiro contém o histórico de todas as partidas da equipa.
 * Para adicionar uma nova partida, adicione um novo objeto ao array.
 * 
 * Cada partida tem os seguintes campos:
 * - id: Identificador único da partida
 * - date: Data da partida (formato: YYYY-MM-DD)
 * - season: Época / Season
 * - mode: Modo de jogo (3v3, 2v2, 1v1)
 * - result: Resultado (win, loss)
 * - goalsTeam: Golos marcados pela equipa
 * - goalsAgainst: Golos sofridos pela equipa
 * - opponent: Nome da equipa adversária
 * - players: Array com os IDs dos jogadores que participaram
 * - mvp: ID do jogador que foi MVP (pode ser null)
 * - playerStats: Estatísticas individuais dos jogadores nesta partida
 *   - goals: Golos marcados pelo jogador
 *   - assists: Assistências feitas pelo jogador
 *   - saves: Defesas feitas pelo jogador
 *   - shots: Remates totais do jogador
 */

const MATCHES_DATA = [];
