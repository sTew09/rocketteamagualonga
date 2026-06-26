/**
 * ============================================
 * TEAM AGUA LONGA - Dados dos Jogadores
 * ============================================
 * 
 * Este ficheiro contém todos os dados dos jogadores da equipa.
 * Para adicionar um novo jogador, adicione um novo objeto ao array.
 * 
 * Cada jogador tem os seguintes campos:
 * - id: Identificador único do jogador
 * - name: Nome completo do jogador
 * - tag: Nickname / Tag usada no jogo
 * - platform: Plataforma (PC, PS, Xbox, Switch)
 * - rlId: Rocket League ID (nome#tag)
 * - joinDate: Data de ingresso na equipa
 * - role: Função do jogador (player, captain, sub)
 * - color: Cor de destaque do jogador (para gráficos)
 */

const PLAYERS_DATA = [
    {
        id: "p1",
        name: "Carlos Mendes",
        tag: "CarlosRL",
        platform: "PC",
        rlId: "CarlosRL#1234",
        joinDate: "2024-01-15",
        role: "captain",
        color: "#f97316"
    },
    {
        id: "p2",
        name: "Miguel Santos",
        tag: "Miguinho",
        platform: "PS",
        rlId: "Miguinho#5678",
        joinDate: "2024-01-15",
        role: "player",
        color: "#3b82f6"
    },
    {
        id: "p3",
        name: "João Ferreira",
        tag: "JoaoF99",
        platform: "Xbox",
        rlId: "JoaoF99#9012",
        joinDate: "2024-02-01",
        role: "player",
        color: "#22c55e"
    },
    {
        id: "p4",
        name: "Pedro Oliveira",
        tag: "PedroOO7",
        platform: "PC",
        rlId: "PedroOO7#3456",
        joinDate: "2024-03-10",
        role: "sub",
        color: "#a855f7"
    },
    {
        id: "p5",
        name: "Ricardo Silva",
        tag: "RickySR",
        platform: "PC",
        rlId: "RickySR#7890",
        joinDate: "2024-04-20",
        role: "player",
        color: "#ef4444"
    }
];