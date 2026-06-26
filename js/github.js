/**
 * ============================================
 * TEAM AGUA LONGA - Módulo GitHub API
 * ============================================
 * 
 * Permite ler e escrever ficheiros diretamente no repositório GitHub
 * através da API REST do GitHub, usando um Personal Access Token (PAT).
 * 
 * O utilizador precisa de:
 * 1. Um GitHub Personal Access Token (com permissão "repo")
 * 2. O nome do repositório (ex: "user/meu-repo")
 * 3. A branch (geralmente "main")
 */

const GitHub = {

    /** Configuração guardada no localStorage */
    getConfig() {
        try {
            return JSON.parse(localStorage.getItem('github_config')) || null;
        } catch {
            return null;
        }
    },

    /** Guarda a configuração */
    saveConfig(config) {
        localStorage.setItem('github_config', JSON.stringify(config));
    },

    /** Verifica se está configurado */
    isConfigured() {
        const config = this.getConfig();
        return config && config.token && config.owner && config.repo && config.branch;
    },

    /**
     * Lê o conteúdo de um ficheiro do repositório
     * @param {string} path - Caminho do ficheiro no repositório
     * @returns {Object} { content, sha }
     */
    async getFile(path) {
        const config = this.getConfig();
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Erro ao ler ${path}: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        // Decodificar de base64
        const content = decodeURIComponent(
            atob(data.content.replace(/\n/g, '')).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );

        return { content, sha: data.sha };
    },

    /**
     * Escreve/atualiza um ficheiro no repositório
     * @param {string} path - Caminho do ficheiro
     * @param {string} content - Conteúdo novo
     * @param {string} message - Mensagem de commit
     * @param {string} sha - SHA atual do ficheiro (requerido para atualizar)
     */
    async writeFile(path, content, message, sha = null) {
        const config = this.getConfig();
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

        const body = {
            message: message,
            content: btoa(unescape(encodeURIComponent(content))), // UTF-8 para base64
            branch: config.branch
        };

        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Erro ao guardar ${path}: ${error.message || response.statusText}`);
        }

        return await response.json();
    },

    /**
     * Testa a ligação ao GitHub
     * @returns {boolean} true se a ligação é válida
     */
    async testConnection() {
        try {
            const config = this.getConfig();
            const url = `https://api.github.com/repos/${config.owner}/${config.repo}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    },

    /**
     * Guarda os dados (jogadores + partidas) diretamente no GitHub
     * @param {Function} onProgress - Callback de progresso
     */
    async saveData(onProgress = null) {
        const config = this.getConfig();
        if (!config) {
            throw new Error('GitHub não está configurado');
        }

        // 1. Gerar código JavaScript dos dados
        if (onProgress) onProgress('A preparar dados dos jogadores...');
        const playersCode = this.generateDataFile('PLAYERS_DATA', PLAYERS_DATA);
        
        if (onProgress) onProgress('A preparar dados das partidas...');
        const matchesCode = this.generateDataFile('MATCHES_DATA', MATCHES_DATA);

        // 2. Ler SHAs atuais dos ficheiros (se existirem)
        let playersSha = null;
        let matchesSha = null;

        if (onProgress) onProgress('A ler ficheiros do repositório...');
        try {
            const playersFile = await this.getFile('data/players.js');
            playersSha = playersFile.sha;
        } catch {
            // Ficheiro pode não existir, ignorar
        }

        try {
            const matchesFile = await this.getFile('data/matches.js');
            matchesSha = matchesFile.sha;
        } catch {
            // Ficheiro pode não existir, ignorar
        }

        // 3. Escrever jogadores
        if (onProgress) onProgress('A guardar jogadores no GitHub...');
        await this.writeFile(
            'data/players.js',
            playersCode,
            '🤖 Atualizar dados dos jogadores - TEAM AGUA LONGA',
            playersSha
        );

        // 4. Esperar 1 segundo para evitar conflito de commits
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 5. Escrever partidas
        if (onProgress) onProgress('A guardar partidas no GitHub...');
        await this.writeFile(
            'data/matches.js',
            matchesCode,
            '🤖 Atualizar dados das partidas - TEAM AGUA LONGA',
            matchesSha
        );

        if (onProgress) onProgress('Concluído!');
        return true;
    },

    /**
     * Gera o código do ficheiro de dados
     * @param {string} varName - Nome da variável
     * @param {Array} data - Dados
     * @returns {string} Código JavaScript
     */
    generateDataFile(varName, data) {
        const header = `/**
 * ============================================
 * TEAM AGUA LONGA - Dados das ${varName === 'PLAYERS_DATA' ? 'Jogadores' : 'Partidas'}
 * ============================================
 * 
 * Este ficheiro é gerado automaticamente pelo painel admin.
 * Última atualização: ${new Date().toLocaleString('pt-PT')}
 */

const ${varName} = ${JSON.stringify(data, null, 4)};`;
        return header;
    },

    /**
     * Mostra o modal de configuração do GitHub
     */
    showConfigModal() {
        const config = this.getConfig() || {};
        
        // Criar modal se não existir
        let modal = document.getElementById('github-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'github-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal" style="max-width: 550px;">
                <div class="modal-header">
                    <h2><i class="fab fa-github" style="margin-right: 0.5rem;"></i>Configuração do GitHub</h2>
                    <button class="btn btn-icon" onclick="GitHub.closeConfigModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
                    Configure o GitHub para guardar as alterações diretamente no repositório.<br>
                    Precisa de um <a href="https://github.com/settings/tokens" target="_blank" style="color: var(--primary);">Personal Access Token</a> com permissão <code>repo</code>.
                </p>
                <div class="form-group">
                    <label><i class="fas fa-key"></i> GitHub Token (PAT)</label>
                    <input type="password" id="gh-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value="${config.token || ''}" autocomplete="off">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-user"></i> Owner (utilizador/org)</label>
                        <input type="text" id="gh-owner" placeholder="ex: ricardo123" value="${config.owner || ''}">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-folder"></i> Repositório</label>
                        <input type="text" id="gh-repo" placeholder="ex: estatisticassite" value="${config.repo || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-code-branch"></i> Branch</label>
                    <input type="text" id="gh-branch" placeholder="main" value="${config.branch || 'main'}">
                </div>
                <div id="gh-test-result" style="margin-bottom: 1rem; font-size: 0.85rem;"></div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-ghost" onclick="GitHub.testConnection()" id="gh-test-btn">
                        <i class="fas fa-plug"></i> Testar Ligação
                    </button>
                    <div style="flex: 1;"></div>
                    <button class="btn btn-ghost" onclick="GitHub.closeConfigModal()">
                        Cancelar
                    </button>
                    <button class="btn btn-primary" onclick="GitHub.saveConfigFromForm()">
                        <i class="fas fa-save"></i> Guardar Configuração
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    /** Fecha o modal de configuração */
    closeConfigModal() {
        const modal = document.getElementById('github-modal');
        if (modal) modal.classList.remove('active');
    },

    /** Lê os valores do formulário e guarda a configuração */
    saveConfigFromForm() {
        const token = document.getElementById('gh-token').value.trim();
        const owner = document.getElementById('gh-owner').value.trim();
        const repo = document.getElementById('gh-repo').value.trim();
        const branch = document.getElementById('gh-branch').value.trim() || 'main';

        if (!token || !owner || !repo) {
            Utils.showToast('Preencha todos os campos obrigatórios!', 'error');
            return;
        }

        this.saveConfig({ token, owner, repo, branch });
        Utils.showToast('Configuração do GitHub guardada!', 'success');
        this.closeConfigModal();
    },

    /** Testa a ligação ao GitHub */
    async testConnection() {
        const btn = document.getElementById('gh-test-btn');
        const result = document.getElementById('gh-test-result');
        
        // Guardar valores temporariamente
        const token = document.getElementById('gh-token').value.trim();
        const owner = document.getElementById('gh-owner').value.trim();
        const repo = document.getElementById('gh-repo').value.trim();
        const branch = document.getElementById('gh-branch').value.trim() || 'main';

        if (!token || !owner || !repo) {
            result.innerHTML = '<span style="color: var(--error);">Preencha todos os campos primeiro.</span>';
            return;
        }

        // Guardar temporariamente
        this.saveConfig({ token, owner, repo, branch });

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A testar...';
        result.innerHTML = '';

        try {
            const ok = await this.testConnection();
            if (ok) {
                result.innerHTML = '<span style="color: var(--success);">✅ Ligação bem-sucedida! Repositório encontrado.</span>';
            } else {
                result.innerHTML = '<span style="color: var(--error);">❌ Ligação falhou. Verifique o token, owner e repositório.</span>';
            }
        } catch (e) {
            result.innerHTML = `<span style="color: var(--error);">❌ Erro: ${e.message}</span>`;
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plug"></i> Testar Ligação';
    },

    /**
     * Guarda os dados e mostra progresso
     */
    async saveAndNotify() {
        if (!this.isConfigured()) {
            this.showConfigModal();
            return;
        }

        // Criar overlay de progresso
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'gh-progress-modal';
        overlay.innerHTML = `
            <div class="modal" style="max-width: 400px; text-align: center;">
                <div style="padding: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">
                        <i class="fab fa-github" style="color: var(--text-primary);"></i>
                    </div>
                    <h3 id="gh-progress-title" style="margin-bottom: 1rem;">A guardar no GitHub...</h3>
                    <p id="gh-progress-msg" style="color: var(--text-secondary); font-size: 0.9rem;">A preparar...</p>
                    <div style="margin-top: 1.5rem;">
                        <div style="height: 4px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden;">
                            <div id="gh-progress-bar" style="height: 100%; width: 30%; background: var(--primary); border-radius: 999px; animation: progress 1.5s ease infinite;"></div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes progress {
                    0% { width: 10%; margin-left: 0; }
                    50% { width: 40%; }
                    100% { width: 10%; margin-left: 90%; }
                }
            </style>
        `;
        document.body.appendChild(overlay);

        try {
            await this.saveData((msg) => {
                const msgEl = document.getElementById('gh-progress-msg');
                if (msgEl) msgEl.textContent = msg;
            });

            overlay.remove();
            Utils.showToast('✅ Dados guardados no GitHub com sucesso!', 'success', 5000);
        } catch (error) {
            overlay.remove();
            Utils.showToast(`❌ Erro ao guardar: ${error.message}`, 'error', 8000);
            console.error('GitHub save error:', error);
        }
    }
};