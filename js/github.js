/**
 * ============================================
 * TEAM AGUA LONGA - Módulo GitHub API
 * ============================================
 * 
 * Permite ler e escrever ficheiros diretamente no repositório GitHub
 * através da API REST do GitHub, usando um Personal Access Token (PAT).
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
        const content = decodeURIComponent(
            atob(data.content.replace(/\n/g, '')).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );

        return { content, sha: data.sha };
    },

    /**
     * Escreve/atualiza um ficheiro no repositório com retry automático
     */
    async writeFile(path, content, message, sha = null) {
        const config = this.getConfig();
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

        // Retry até 3 vezes em caso de conflito de SHA
        for (let attempt = 1; attempt <= 3; attempt++) {
            // Reler SHA antes de cada tentativa (exceto na primeira se já temos)
            if (attempt > 1 || !sha) {
                try {
                    const f = await this.getFile(path);
                    sha = f.sha;
                } catch { /* ficheiro pode não existir */ }
            }

            const body = {
                message: message,
                content: btoa(unescape(encodeURIComponent(content))),
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

            if (response.ok) {
                return await response.json();
            }

            const error = await response.json().catch(() => ({}));

            // Se é conflito de SHA, retry
            if (response.status === 422 && attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            throw new Error(`Erro ao guardar ${path}: ${error.message || response.statusText}`);
        }
    },

    /**
     * Testa a ligação ao GitHub e deteta a branch correta
     */
    async testConnection() {
        try {
            const config = this.getConfig();
            
            // Testar acesso ao repositório
            const repoUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
            const repoResp = await fetch(repoUrl, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!repoResp.ok) {
                return { ok: false, message: 'Repositório não encontrado. Verifique owner e nome do repositório.' };
            }

            const repoData = await repoResp.json();
            
            // Verificar se a branch existe
            const branchUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/branches/${config.branch}`;
            const branchResp = await fetch(branchUrl, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!branchResp.ok) {
                // Ajustar para a branch padrão
                const defaultBranch = repoData.default_branch || 'main';
                config.branch = defaultBranch;
                this.saveConfig(config);
                return { ok: true, message: `Branch "${config.branch}" não encontrada. Ajustada para a branch padrão: "${defaultBranch}".` };
            }

            return { ok: true, message: `Repositório e branch "${config.branch}" encontrados!` };
        } catch (e) {
            return { ok: false, message: e.message };
        }
    },

    /**
     * Guarda os dados diretamente no GitHub
     * Relê o SHA imediatamente antes de cada escrita para evitar conflitos
     */
    async saveData(onProgress = null) {
        const config = this.getConfig();
        if (!config) {
            throw new Error('GitHub não está configurado. Clique em ⚙️ para configurar.');
        }

        if (onProgress) onProgress('A preparar dados dos jogadores...');
        const playersCode = this.generateDataFile('PLAYERS_DATA', PLAYERS_DATA);
        
        if (onProgress) onProgress('A preparar dados das partidas...');
        const matchesCode = this.generateDataFile('MATCHES_DATA', MATCHES_DATA);

        // Escrever jogadores — reler SHA imediatamente antes
        if (onProgress) onProgress('A guardar jogadores no GitHub...');
        let playersSha = null;
        try {
            const f = await this.getFile('data/players.js');
            playersSha = f.sha;
        } catch { /* ficheiro pode não existir */ }
        await this.writeFile('data/players.js', playersCode, '🤖 Atualizar jogadores - TEAM AGUA LONGA', playersSha);

        // Esperar para evitar conflito
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Escrever partidas — reler SHA imediatamente antes
        if (onProgress) onProgress('A guardar partidas no GitHub...');
        let matchesSha = null;
        try {
            const f = await this.getFile('data/matches.js');
            matchesSha = f.sha;
        } catch { /* ficheiro pode não existir */ }
        await this.writeFile('data/matches.js', matchesCode, '🤖 Atualizar partidas - TEAM AGUA LONGA', matchesSha);

        if (onProgress) onProgress('Concluído!');
        return true;
    },

    /**
     * Gera o código do ficheiro de dados
     */
    generateDataFile(varName, data) {
        return `/**
 * ============================================
 * TEAM AGUA LONGA - Dados das ${varName === 'PLAYERS_DATA' ? 'Jogadores' : 'Partidas'}
 * ============================================
 * 
 * Este ficheiro é gerado automaticamente pelo painel admin.
 * Última atualização: ${new Date().toLocaleString('pt-PT')}
 */

const ${varName} = ${JSON.stringify(data, null, 4)};`;
    },

    /**
     * Mostra o modal de configuração do GitHub
     */
    showConfigModal() {
        const config = this.getConfig() || {};
        
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
                    Configure o GitHub para guardar alterações diretamente no repositório.<br>
                    Precisa de um <a href="https://github.com/settings/tokens" target="_blank" style="color: var(--primary);">Personal Access Token</a> com permissão <code>repo</code>.
                </p>
                <div class="form-group">
                    <label><i class="fas fa-key"></i> GitHub Token (PAT)</label>
                    <input type="password" id="gh-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value="${config.token || ''}" autocomplete="off">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-user"></i> Owner (utilizador)</label>
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
                    <button class="btn btn-ghost" onclick="GitHub.testConnectionUI()" id="gh-test-btn">
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

    /** Testa a ligação (UI) */
    async testConnectionUI() {
        const btn = document.getElementById('gh-test-btn');
        const result = document.getElementById('gh-test-result');
        
        const token = document.getElementById('gh-token').value.trim();
        const owner = document.getElementById('gh-owner').value.trim();
        const repo = document.getElementById('gh-repo').value.trim();
        const branch = document.getElementById('gh-branch').value.trim() || 'main';

        if (!token || !owner || !repo) {
            result.innerHTML = '<span style="color: var(--error);">Preencha todos os campos primeiro.</span>';
            return;
        }

        this.saveConfig({ token, owner, repo, branch });

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A testar...';
        result.innerHTML = '';

        try {
            const testResult = await this.testConnection();
            if (testResult.ok) {
                result.innerHTML = `<span style="color: var(--success);">✅ ${testResult.message}</span>`;
                document.getElementById('gh-branch').value = this.getConfig().branch;
            } else {
                result.innerHTML = `<span style="color: var(--error);">❌ ${testResult.message}</span>`;
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

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'gh-progress-modal';
        overlay.innerHTML = `
            <div class="modal" style="max-width: 400px; text-align: center;">
                <div style="padding: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">
                        <i class="fab fa-github" style="color: var(--text-primary);"></i>
                    </div>
                    <h3 style="margin-bottom: 1rem;">A guardar no GitHub...</h3>
                    <p id="gh-progress-msg" style="color: var(--text-secondary); font-size: 0.9rem;">A preparar...</p>
                    <div style="margin-top: 1.5rem;">
                        <div style="height: 4px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden;">
                            <div style="height: 100%; width: 30%; background: var(--primary); border-radius: 999px; animation: progressAnim 1.5s ease infinite;"></div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes progressAnim {
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
            Utils.showToast(`❌ ${error.message}`, 'error', 8000);
            console.error('GitHub save error:', error);
        }
    }
};
