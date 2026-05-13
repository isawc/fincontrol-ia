document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // SPA NAVIGATION LOGIC
    // ==========================================
    const API_URL = "http://localhost:8000";
    const menuItems = document.querySelectorAll('.menu-item');
    const dashboardViews = document.querySelectorAll('main.view');
    const aiPanels = document.querySelectorAll('aside.view');
    const authOverlay = document.getElementById('authOverlay');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const authError = document.getElementById('authError');

    const getToken = () => localStorage.getItem('access_token');

    const authHeaders = () => ({
        'Authorization': `Bearer ${getToken()}`
    });

    const authFetch = (url, options = {}) => {
        const headers = {
            ...(options.headers || {}),
            ...authHeaders()
        };

        return fetch(url, { ...options, headers });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        authOverlay.classList.remove('hidden');
    };

    const formatCurrency = (value) => {
        return `R$${Number(value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const getTransactionIcon = (type) => {
        return type === 'income' ? 'ph-arrow-circle-up' : 'ph-arrow-circle-down';
    };
    const showAuthError = (msg) => {
        authError.textContent = msg;
        authError.style.display = 'block';
    };

    const hideAuth = (token, userId, name) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_id', userId);
        localStorage.setItem('user_name', name);
        authOverlay.classList.add('hidden');
        fetchOverview();
        fetchUser();
    };

    const checkAuth = () => {
        if (getToken()) {
            authOverlay.classList.add('hidden');
        }
    };

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.style.display = 'block';
        formRegister.style.display = 'none';
        authError.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.style.display = 'block';
        formLogin.style.display = 'none';
        authError.style.display = 'none';
    });

    document.getElementById('btnLogin').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) return showAuthError('Preencha todos os campos');

        const form = new FormData();
        form.append('username', email);
        form.append('password', password);

        try {
            const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: form });
            const data = await res.json();
            if (!res.ok) return showAuthError(data.detail || 'Erro ao fazer login');
            hideAuth(data.access_token, data.user_id, data.name);
        } catch {
            showAuthError('Erro de conexão com o servidor');
        }
    });

    document.getElementById('btnRegister').addEventListener('click', async () => {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        if (!name || !email || !password) return showAuthError('Preencha todos os campos');

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!res.ok) return showAuthError(data.detail || 'Erro ao cadastrar');
            hideAuth(data.access_token, data.user_id, data.name);
        } catch {
            showAuthError('Erro de conexão com o servidor');
        }
    });

    checkAuth();

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Get target view from data attribute
            const target = item.getAttribute('data-target');
            if (!target) return; // Ignore clicks on menu items without data-target

            // 1. Update Menu Active State
            menuItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 2. Hide all views and panels
            dashboardViews.forEach(view => view.classList.remove('active'));
            aiPanels.forEach(panel => panel.classList.remove('active'));

            // 3. Show target view and panel
            const targetDashboard = document.getElementById(`${target}-dashboard`);
            const targetAiPanel = document.getElementById(`${target}-ai`);

            if (targetDashboard) targetDashboard.classList.add('active');
            if (targetAiPanel) targetAiPanel.classList.add('active');

            if (target === 'transactions') {
                fetchTransactions();
                setupTransactionFilters();
            }
        });
    });

    const btnViewTransactions = document.getElementById('btnViewTransactions');
    if (btnViewTransactions) {
        btnViewTransactions.addEventListener('click', () => {
            document.querySelector('.menu-item[data-target="transactions"]')?.click();
        });
    }

    // ==========================================
    // MODALS LOGIC
    // ==========================================
    // Add Money Modal
    const addMoneyBtn = document.querySelector('#overview-dashboard .btn-primary:has(.ph-plus)');
    const addMoneyModal = document.getElementById('addMoneyModal');
    const closeAddMoneyBtn = document.getElementById('closeAddMoneyBtn');
    const cancelAddMoneyBtn = document.getElementById('cancelAddMoneyBtn');
    const confirmAddMoneyBtn = document.getElementById('confirmAddMoneyBtn');
    const addMoneyAmountInput = document.getElementById('addMoneyAmount');
    const quickBtns = document.querySelectorAll('#addMoneyModal .quick-btn');

    // Open Modal
    if (addMoneyBtn && addMoneyModal) {
        addMoneyBtn.addEventListener('click', () => {
            addMoneyModal.classList.add('active');
            setTimeout(() => addMoneyAmountInput.focus(), 100);
        });
    }

    // Close Modal Logic
    const closeAddMoneyModal = () => {
        addMoneyModal.classList.remove('active');
        // Reset input and buttons
        setTimeout(() => {
            addMoneyAmountInput.value = '';
            quickBtns.forEach(btn => btn.classList.remove('active'));
        }, 300);
    };

    if (closeAddMoneyBtn) closeAddMoneyBtn.addEventListener('click', closeAddMoneyModal);
    if (cancelAddMoneyBtn) cancelAddMoneyBtn.addEventListener('click', closeAddMoneyModal);

    // Close on overlay click
    if (addMoneyModal) {
        addMoneyModal.addEventListener('click', (e) => {
            if (e.target === addMoneyModal) {
                closeAddMoneyModal();
            }
        });
    }

    // Quick Amounts Logic
    if (quickBtns.length > 0) {
        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all
                quickBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');

                // Parse value and set to input
                let val = btn.textContent.replace('R$', '').replace('$', '').replace('k', '000');
                addMoneyAmountInput.value = val;
            });
        });
    }

    // Confirm button logic
    if (confirmAddMoneyBtn) {
        confirmAddMoneyBtn.addEventListener('click', async () => {
            const amount = Number(addMoneyAmountInput.value);
            if (!amount || amount <= 0) {
                alert('Informe um valor válido.');
                return;
            }

            const originalText = confirmAddMoneyBtn.innerHTML;
            confirmAddMoneyBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processando...';
            confirmAddMoneyBtn.style.opacity = '0.8';
            confirmAddMoneyBtn.style.pointerEvents = 'none';

            try {
                const category = addMoneyModal.querySelector('select')?.value || 'Outros';
                const res = await authFetch(`${API_URL}/transactions/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        type: 'income',
                        category,
                        description: `Receita: ${category}`
                    })
                });

                if (!res.ok) {
                    throw new Error('Erro ao salvar receita');
                }

                confirmAddMoneyBtn.innerHTML = '<i class="ph ph-check-circle"></i> Concluído';
                confirmAddMoneyBtn.style.backgroundColor = '#008F4C';
                confirmAddMoneyBtn.style.color = '#FFF';
                showToast('Receita registrada com sucesso.', 'success');
                fetchOverview(true);

                setTimeout(() => {
                    closeAddMoneyModal();
                    setTimeout(() => {
                        confirmAddMoneyBtn.innerHTML = originalText;
                        confirmAddMoneyBtn.style.backgroundColor = '';
                        confirmAddMoneyBtn.style.color = '';
                        confirmAddMoneyBtn.style.opacity = '1';
                        confirmAddMoneyBtn.style.pointerEvents = 'auto';
                    }, 300);
                }, 1000);
            } catch (error) {
                showToast('Não foi possível salvar a receita.', 'error');
                confirmAddMoneyBtn.innerHTML = originalText;
                confirmAddMoneyBtn.style.opacity = '1';
                confirmAddMoneyBtn.style.pointerEvents = 'auto';
            }
        });
    }

    // ==========================================
    // BACKEND INTEGRATION (API CALLS)
    // ==========================================

    const fetchOverview = async (silent = false) => {
        try {
            const res = await authFetch(`${API_URL}/transactions/`);
            if (res.ok) {
                const transactions = await res.json();

                const balance = transactions.reduce((acc, tx) => {
                    return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
                }, 0);

                const balanceEl = document.querySelector('.balance-amount');
                if (balanceEl) {
                    balanceEl.textContent = formatCurrency(balance);
                }

                const countBadge = document.getElementById('transaction-count-badge');
                if (countBadge) {
                    countBadge.innerHTML = `<i class="ph ph-wallet"></i> ${transactions.length} transações`;
                }

                const categories = {};
                transactions.forEach(tx => {
                    if (tx.type === 'expense') {
                        categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
                    }
                });

                const totalSpent = Object.values(categories).reduce((a, b) => a + b, 0);
                const totalSpentEl = document.querySelector('.chart-center h3');
                if (totalSpentEl) {
                    totalSpentEl.textContent = formatCurrency(totalSpent);
                }
            
                updateChart(categories);
                renderOverviewTransactions(transactions.slice(0, 4));
                fetchUser();

                const legend = document.getElementById('spending-legend');
                if (legend) {
                    const total = Object.values(categories).reduce((a, b) => a + b, 0);
                    const colors = ['#00E57A', '#008F4C', '#244231', '#1A2A20', '#4CAF50'];
                    const entries = Object.entries(categories);
                    legend.innerHTML = entries.length === 0
                        ? '<p class="empty-state">Nenhuma despesa registrada ainda.</p>'
                        : entries.map(([cat, val], i) => `
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: ${colors[i % colors.length]};"></div>
                            <div class="legend-info">
                                <span class="legend-label">${cat}</span>
                                <span class="legend-value">${total > 0 ? Math.round((val / total) * 100) : 0}%</span>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error("Error fetching overview:", error);
            if (!silent) showToast("Não foi possível conectar ao backend", "error");
        }
    };

        // Busca e renderiza transações reais na aba Transactions
    const fetchTransactions = async () => {
        try {
            const res = await authFetch(`${API_URL}/transactions/`);
            if (!res.ok) return;
            const transactions = await res.json();
            renderTransactions(transactions);
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        }
    };

    const renderTransactions = (transactions) => {
        const container = document.querySelector('#transactions-dashboard .transactions-container');
        if (!container) return;
        container.innerHTML = transactions.length === 0
            ? '<p style="color: var(--text-muted); padding: 20px;">Nenhuma transação encontrada.</p>'
            : transactions.map(tx => {
                const date = new Date(tx.date).toLocaleDateString('pt-BR');
                const isIncome = tx.type === 'income';
                return `
                    <div class="transaction-item">
                        <div class="tx-icon ${isIncome ? 'income' : 'expense'}">
                            <i class="ph ${getTransactionIcon(tx.type)}"></i>
                        </div>
                        <div class="tx-info">
                            <h4>${tx.description || tx.category}</h4>
                            <span>${tx.category} • ${date}</span>
                        </div>
                        <div class="tx-amount ${isIncome ? 'positive' : 'negative'}">
                            ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
                        </div>
                    </div>
                `;
            }).join('');
    };

    const renderOverviewTransactions = (transactions) => {
        const container = document.getElementById('overview-transactions');
        if (!container) return;

        container.innerHTML = transactions.length === 0
            ? '<p class="empty-state">Nenhuma transação registrada ainda.</p>'
            : transactions.map(tx => {
                const date = new Date(tx.date).toLocaleDateString('pt-BR');
                const isIncome = tx.type === 'income';

                return `
                    <div class="transaction-item">
                        <div class="tx-icon ${isIncome ? 'income' : 'expense'}">
                            <i class="ph ${getTransactionIcon(tx.type)}"></i>
                        </div>
                        <div class="tx-info">
                            <h4>${tx.description || tx.category}</h4>
                            <span>${tx.category} • ${date}</span>
                        </div>
                        <div class="tx-amount ${isIncome ? 'positive' : 'negative'}">
                            ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
                        </div>
                    </div>
                `;
            }).join('');
    };

    const setupTransactionFilters = () => {
        const tabs = document.querySelectorAll('#transactions-dashboard .tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.textContent.trim().toLowerCase();
                const res = await authFetch(`${API_URL}/transactions/`);
                if (!res.ok) return;
                const all = await res.json();
                const filtered = filter === 'todas' ? all
                    : filter === 'receitas' ? all.filter(tx => tx.type === 'income')
                    : filter === 'despesas' ? all.filter(tx => tx.type === 'expense')
                    : all;
                renderTransactions(filtered);
            });
        });
    };

    const fetchUser = async () => {
        try {
            const res = await authFetch(`${API_URL}/transactions/`);
            if (!res.ok) return;

            const userRes = await authFetch(`${API_URL}/users/me`);
            if (!userRes.ok) return;
            const user = await userRes.json();

            const nameEl = document.querySelector('.user-name');
            if (nameEl) nameEl.textContent = user.name;

            const headerEl = document.querySelector('.header-titles p');
            if (headerEl) headerEl.textContent = `Bem-vindo, ${user.name}. Suas finanças estão sob controle.`;

        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
        }
    };

    // Expõe fetchOverview globalmente para poder ser chamada de qualquer lugar
    window.fetchOverview = fetchOverview;

    if (getToken()) {
        fetchOverview();
    }

    // ==========================================
    // CHART.JS LOGIC (Overview Dashboard)
    // ==========================================
    let spendingChartInstance = null;

    const updateChart = (categories) => {
        const chartCanvas = document.getElementById('spendingChart');
        if (!chartCanvas) return;

        const ctx = chartCanvas.getContext('2d');

        const labels = Object.keys(categories);
        const values = Object.values(categories);

        // If no expenses, fallback to empty chart
        if (values.length === 0) {
            labels.push("Sem despesas");
            values.push(1);
        }

        if (spendingChartInstance) {
            spendingChartInstance.data.labels = labels;
            spendingChartInstance.data.datasets[0].data = values;
            spendingChartInstance.update();
            return;
        }

        spendingChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#00E57A', '#008F4C', '#244231', '#1A2A20', '#4CAF50'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#111A15',
                        titleColor: '#8FA396',
                        bodyColor: '#FFFFFF',
                        borderColor: 'rgba(0, 229, 122, 0.2)',
                        borderWidth: 1,
                        padding: 12
                    }
                }
            }
        });
    };// Replaced chart logic on the top with `updateChart`
    // ==========================================
    // TOAST NOTIFICATION SYSTEM
    // ==========================================
    const showToast = (message, type = 'info') => {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            Object.assign(toastContainer.style, {
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: '9999',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none' // Let clicks pass through empty space
            });
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        // Colors that match the dashboard aesthetic
        const bg = type === 'success' ? 'rgba(0, 143, 76, 0.95)' :
            (type === 'error' ? 'rgba(255, 76, 76, 0.95)' : 'rgba(23, 33, 27, 0.95)');
        const border = type === 'success' ? 'rgba(0, 229, 122, 0.3)' : 'rgba(255, 255, 255, 0.1)';

        Object.assign(toast.style, {
            background: bg,
            color: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: `1px solid ${border}`,
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: '500',
            transform: 'translateX(120%)',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease',
            opacity: '0',
            pointerEvents: 'auto'
        });

        let iconClass = 'ph-info';
        let iconColor = 'var(--text-main)';
        if (type === 'success') { iconClass = 'ph-check-circle'; iconColor = '#00E57A'; }
        if (type === 'error') { iconClass = 'ph-warning-circle'; iconColor = '#FF4C4C'; }
        if (type === 'info') { iconClass = 'ph-bell-ringing'; iconColor = '#00E57A'; }

        toast.innerHTML = `
            <i class="ph-fill ${iconClass}" style="font-size: 20px; color: ${iconColor};"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Animate out and remove
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 3500);
    };

    // ==========================================
    // FILTER TABS LOGIC
    // ==========================================
    const setupTabs = (containerSelector) => {
        const containers = document.querySelectorAll(containerSelector);
        containers.forEach(container => {
            const tabs = container.querySelectorAll('.tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                });
            });
        });
    };
    setupTabs('.filter-tabs');

    // ==========================================
    // CHAT INPUT LOGIC
    // ==========================================
    const chatInputAreas = document.querySelectorAll('.chat-input-area');
    chatInputAreas.forEach(area => {
        const input = area.querySelector('input');
        const sendBtn = area.querySelector('.send-btn');
        const micBtn = area.querySelector('.mic-btn');
        const chatArea = area.previousElementSibling;

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            // Add user message
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const userHtml = `
                <div class="message user-message" style="opacity: 0; transform: translateY(10px); transition: all 0.3s ease;">
                    <div class="bubble">${text}</div>
                    <span class="time">${time}</span>
                </div>
            `;
            chatArea.insertAdjacentHTML('beforeend', userHtml);
            input.value = '';

            // Animate
            const newMsg = chatArea.lastElementChild;
            requestAnimationFrame(() => {
                newMsg.style.opacity = '1';
                newMsg.style.transform = 'translateY(0)';
            });
            chatArea.scrollTop = chatArea.scrollHeight;

            // Show Typing Indicator
            const typingHtml = `
                <div class="message ai-message typing-indicator" id="typing-${Date.now()}">
                    <div class="bubble"><i class="ph ph-spinner ph-spin" style="font-size: 18px;"></i> Analisando...</div>
                </div>
            `;
            chatArea.insertAdjacentHTML('beforeend', typingHtml);
            const typingMsg = chatArea.lastElementChild;
            chatArea.scrollTop = chatArea.scrollHeight;

            try {
                // Call real AI backend
                const res = await authFetch(`${API_URL}/ai/parse`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                typingMsg.remove(); // Remove thinking message

                if (res.ok) {
                    const data = await res.json();

                    const aiHtml = `
                        <div class="message ai-message" style="opacity: 0; transform: translateY(10px); transition: all 0.3s ease;">
                            <div class="bubble">${data.reply.replace(/\n/g, '<br>')}</div>
                            <span class="time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    `;
                    chatArea.insertAdjacentHTML('beforeend', aiHtml);

                    if (data.action_taken) {
                        showToast('Transação registrada com sucesso!', 'success');
                        fetchOverview(true);
                    }
                } else {
                    throw new Error("Server error");
                }
            } catch (error) {
                typingMsg.remove();
                showToast("Não foi possível processar a mensagem.", "error");
            }

            const newAiMsg = chatArea.lastElementChild;
            if (newAiMsg) {
                requestAnimationFrame(() => {
                    newAiMsg.style.opacity = '1';
                    newAiMsg.style.transform = 'translateY(0)';
                });
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        };

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }
        if (micBtn) {
            micBtn.addEventListener('click', () => {
                showToast('Microphone access requested...', 'info');
            });
        }
    });

    // ==========================================
    // GENERAL BUTTON ACTIONS (MOCK)
    // ==========================================
    const handleAction = (selector, message, type = 'info') => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.addEventListener('click', (e) => {
                if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                    e.preventDefault();
                }
                showToast(message, type);
            });
        });
    };

    // Header Actions
    handleAction('.header-actions .icon-btn:has(.ph-bell)', 'Você não tem novas notificações.', 'info');
    handleAction('.header-actions .icon-btn:has(.ph-gear)', 'Configurações em desenvolvimento.', 'info');

    // Sidebar Actions
    handleAction('.upgrade-btn', 'Plano premium em desenvolvimento.', 'info');
    handleAction('.user-profile', 'Perfil do usuário em desenvolvimento.', 'info');

    // Dashboard Specific Actions
    handleAction('.balance-actions .btn-secondary', 'Envio rápido em desenvolvimento.', 'info');
    handleAction('main#transactions-dashboard .header-actions .btn-secondary:nth-child(1)', 'Filtros em desenvolvimento.', 'info');
    handleAction('main#transactions-dashboard .header-actions .btn-secondary:nth-child(2)', 'Exportação em desenvolvimento.', 'info');

    // Goals Actions
    handleAction('main#goals-dashboard .header-actions .btn-primary', 'Cadastro de metas em desenvolvimento.', 'info');
    handleAction('.goal-suggestion .btn-secondary', 'Ação de meta em desenvolvimento.', 'info');
    handleAction('.goal-header .icon-btn', 'Opções da meta em desenvolvimento.', 'info');
    handleAction('.add-goal-card', 'Cadastro de metas em desenvolvimento.', 'info');

    // Investments Actions
    handleAction('main#investments-dashboard .header-actions .btn-secondary', 'Investimentos automáticos em desenvolvimento.', 'info');
    handleAction('main#investments-dashboard .header-actions .btn-primary', 'Área de investimentos em desenvolvimento.', 'info');
    handleAction('.insight-banner .btn-secondary', 'Análise de carteira em desenvolvimento.', 'info');

    // AI Panel Header Details
    handleAction('.ai-header .icon-btn', 'Configurações da IA em desenvolvimento.', 'info');
});
