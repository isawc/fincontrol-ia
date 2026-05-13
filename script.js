document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // SPA NAVIGATION LOGIC
    // ==========================================
    const menuItems = document.querySelectorAll('.menu-item');
    const dashboardViews = document.querySelectorAll('main.view');
    const aiPanels = document.querySelectorAll('aside.view');

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
        });
    });

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
                let val = btn.textContent.replace('$', '').replace('k', '000');
                addMoneyAmountInput.value = val;
            });
        });
    }

    // Confirm button logic
    if (confirmAddMoneyBtn) {
        confirmAddMoneyBtn.addEventListener('click', () => {
            const amount = addMoneyAmountInput.value;
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount.');
                return;
            }

            // In a real app, send to backend here
            const originalText = confirmAddMoneyBtn.innerHTML;
            confirmAddMoneyBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';
            confirmAddMoneyBtn.style.opacity = '0.8';
            confirmAddMoneyBtn.style.pointerEvents = 'none';

            setTimeout(() => {
                confirmAddMoneyBtn.innerHTML = '<i class="ph ph-check-circle"></i> Success!';
                confirmAddMoneyBtn.style.backgroundColor = '#008F4C';
                confirmAddMoneyBtn.style.color = '#FFF';

                setTimeout(() => {
                    closeAddMoneyModal();
                    // Reset button state
                    setTimeout(() => {
                        confirmAddMoneyBtn.innerHTML = originalText;
                        confirmAddMoneyBtn.style.backgroundColor = '';
                        confirmAddMoneyBtn.style.color = '';
                        confirmAddMoneyBtn.style.opacity = '1';
                        confirmAddMoneyBtn.style.pointerEvents = 'auto';

                        // Optional: update balance here in a real app
                    }, 300);
                }, 1000);
            }, 1000);
        });
    }

    // ==========================================
    // BACKEND INTEGRATION (API CALLS)
    // ==========================================
    const API_URL = "http://localhost:8000";

    const fetchOverview = async (silent = false) => {
        try {
            const res = await fetch(`${API_URL}/transactions/?user_id=1`);
            if (res.ok) {
                const transactions = await res.json();

                const balance = transactions.reduce((acc, tx) => {
                    return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
                }, 0);

                const balanceEl = document.querySelector('.balance-amount');
                if (balanceEl) {
                    balanceEl.textContent = `R$${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
                    totalSpentEl.textContent = `R$${totalSpent.toLocaleString('pt-BR')}`;
                }
            
                updateChart(categories);

                const legend = document.getElementById('spending-legend');
                if (legend) {
                    const total = Object.values(categories).reduce((a, b) => a + b, 0);
                    const colors = ['#00E57A', '#008F4C', '#244231', '#1A2A20', '#4CAF50'];
                    legend.innerHTML = Object.entries(categories).map(([cat, val], i) => `
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
            if (!silent) showToast("Failed to connect to backend", "error");
        }
    };

        // Busca e renderiza transações reais na aba Transactions
    const fetchTransactions = async () => {
        try {
            const res = await fetch(`${API_URL}/transactions/?user_id=1`);
            if (!res.ok) return;
            const transactions = await res.json();

            const container = document.querySelector('#transactions-dashboard .transactions-container');
            if (!container) return;

            if (transactions.length === 0) {
                container.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">Nenhuma transação encontrada.</p>';
                return;
            }

            container.innerHTML = transactions.map(tx => {
                const date = new Date(tx.date).toLocaleDateString('pt-BR');
                const isIncome = tx.type === 'income';
                const icon = isIncome ? 'ph-arrow-circle-up' : 'ph-arrow-circle-down';
                const colorClass = isIncome ? 'income' : 'expense';
                const signal = isIncome ? '+' : '-';

                return `
                    <div class="transaction-item">
                        <div class="tx-icon ${colorClass}">
                            <i class="ph ${icon}"></i>
                        </div>
                        <div class="tx-info">
                            <h4>${tx.description || tx.category}</h4>
                            <span>${tx.category} • ${date}</span>
                        </div>
                        <div class="tx-amount ${isIncome ? 'positive' : 'negative'}">
                            ${signal}R$${tx.amount.toFixed(2)}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        }
    };

    // Load initial data
    fetchTransactions();
    fetchOverview();

    // Expõe fetchOverview globalmente para poder ser chamada de qualquer lugar
    window.fetchOverview = fetchOverview;

    // Load initial data
    fetchOverview();

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
            labels.push("No Expenses Yet");
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
                    <div class="bubble"><i class="ph ph-spinner ph-spin" style="font-size: 18px;"></i> AI is thinking...</div>
                </div>
            `;
            chatArea.insertAdjacentHTML('beforeend', typingHtml);
            const typingMsg = chatArea.lastElementChild;
            chatArea.scrollTop = chatArea.scrollHeight;

            try {
                // Call real AI backend
                const res = await fetch(`${API_URL}/ai/parse`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, user_id: 1 })
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
                        showToast('Transação registrada com sucesso! 💰', 'success');
                        fetchOverview(true);
                    }
                } else {
                    throw new Error("Server error");
                }
            } catch (error) {
                typingMsg.remove();
                showToast("AI Request Failed.", "error");
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
    handleAction('.header-actions .icon-btn:has(.ph-bell)', 'You have no new notifications.', 'info');
    handleAction('.header-actions .icon-btn:has(.ph-gear)', 'Settings panel is under construction.', 'info');

    // Sidebar Actions
    handleAction('.upgrade-btn', 'Redirecting to secure payment gateway...', 'success');
    handleAction('.user-profile', 'Opening user profile settings...', 'info');

    // Dashboard Specific Actions
    handleAction('.balance-actions .btn-secondary', 'Opening quick-send modal...', 'info');
    handleAction('main#transactions-dashboard .header-actions .btn-secondary:nth-child(1)', 'Advanced filters applied.', 'success');
    handleAction('main#transactions-dashboard .header-actions .btn-secondary:nth-child(2)', 'Exporting CSV of transactions...', 'success');

    // Goals Actions
    handleAction('main#goals-dashboard .header-actions .btn-primary', 'Opening Goal Creator...', 'info');
    handleAction('.goal-suggestion .btn-secondary', 'Bonus of $1,200 applied to your goal! 🎉', 'success');
    handleAction('.goal-header .icon-btn', 'Goal options menu opened.', 'info');
    handleAction('.add-goal-card', 'Opening Goal Creator...', 'info');

    // Investments Actions
    handleAction('main#investments-dashboard .header-actions .btn-secondary', 'Auto-Invest rules configured.', 'success');
    handleAction('main#investments-dashboard .header-actions .btn-primary', 'Marketplace opening...', 'info');
    handleAction('.insight-banner .btn-secondary', 'Starting portfolio rebalance advisor...', 'success');

    // AI Panel Header Details
    handleAction('.ai-header .icon-btn', 'AI Assistant settings opened.', 'info');
});
