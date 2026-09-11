/**
 * SmartUps - Main Application Controller
 * Handles DOM synchronization, UI events, toast notifications, and user modals.
 */

// Global Toast Notification Helper
window.showToast = function(message, type = "info") {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const borderColors = {
        info: "border-cyan-500/60 bg-cyan-950/90 text-cyan-200",
        success: "border-emerald-500/60 bg-emerald-950/90 text-emerald-200",
        warning: "border-amber-500/60 bg-amber-950/90 text-amber-200",
        danger: "border-rose-500/60 bg-rose-950/90 text-rose-200"
    };

    const icons = {
        info: "ℹ️",
        success: "✅",
        warning: "⚠️",
        danger: "🚨"
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${borderColors[type] || borderColors.info}`;
    toast.innerHTML = `
        <span class="text-base">${icons[type] || "⚡"}</span>
        <span class="flex-1">${message}</span>
        <button class="text-xs text-gray-400 hover:text-white ml-2 cursor-pointer font-bold">✕</button>
    `;

    toast.querySelector('button').addEventListener('click', () => {
        toast.remove();
    });

    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => toast.remove(), 350);
    }, 4000);
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupAuthListeners();
    setupEngineListeners();
    setupSimulatorControls();
    setupModalHandlers();
    setupQuickActions();

    // Initial render
    updateAuthUI();
    renderDashboard(window.smartUpsEngine.data);

    // Initialize Lucide icons if present
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// -------------------------------------------------------------
// Authentication & User Header
// -------------------------------------------------------------
function setupAuthListeners() {
    window.addEventListener('smartups:auth-changed', (e) => {
        updateAuthUI();
        if (window.smartUpsAuth.isAuthenticated()) {
            renderDashboard(window.smartUpsEngine.data);
        }
    });

    // Quick demo login buttons (handles both gate screen and modal buttons)
    document.querySelectorAll('.btn-quick-login').forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.role;
            const res = window.smartUpsAuth.quickLogin(role);
            if (res.success) {
                window.showToast(`Access Granted: Logged in as ${res.user.name} (${res.user.role.toUpperCase()})`, "success");
                closeLoginModal();
            }
        });
    });

    // Gate Screen Login Form
    const gateLoginForm = document.getElementById('gateLoginForm');
    if (gateLoginForm) {
        gateLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('gateLoginEmail').value;
            const password = document.getElementById('gateLoginPassword').value;
            const res = window.smartUpsAuth.login(email, password);
            if (res.success) {
                window.showToast(`Access Granted: Welcome back, ${res.user.name}!`, "success");
            } else {
                window.showToast(res.message, "danger");
            }
        });
    }

    // Gate Screen Register Form
    const gateRegisterForm = document.getElementById('gateRegisterForm');
    if (gateRegisterForm) {
        gateRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('gateRegName').value;
            const email = document.getElementById('gateRegEmail').value;
            const password = document.getElementById('gateRegPassword').value;
            const role = document.getElementById('gateRegRole').value;

            const res = window.smartUpsAuth.register(name, email, password, role);
            if (res.success) {
                window.showToast(`Account Created: Welcome, ${res.user.name}!`, "success");
            } else {
                window.showToast(res.message, "warning");
            }
        });
    }

    // Gate Screen Tabs
    const tabGateLogin = document.getElementById('tabGateLogin');
    const tabGateRegister = document.getElementById('tabGateRegister');
    const formGateLogin = document.getElementById('gateLoginForm');
    const formGateRegister = document.getElementById('gateRegisterForm');

    if (tabGateLogin && tabGateRegister) {
        tabGateLogin.addEventListener('click', () => {
            tabGateLogin.classList.add('text-cyan-400', 'border-cyan-400');
            tabGateLogin.classList.remove('text-slate-400', 'border-transparent');
            tabGateRegister.classList.remove('text-cyan-400', 'border-cyan-400');
            tabGateRegister.classList.add('text-slate-400', 'border-transparent');
            formGateLogin.classList.remove('hidden');
            formGateRegister.classList.add('hidden');
        });

        tabGateRegister.addEventListener('click', () => {
            tabGateRegister.classList.add('text-cyan-400', 'border-cyan-400');
            tabGateRegister.classList.remove('text-slate-400', 'border-transparent');
            tabGateLogin.classList.remove('text-cyan-400', 'border-cyan-400');
            tabGateLogin.classList.add('text-slate-400', 'border-transparent');
            formGateRegister.classList.remove('hidden');
            formGateLogin.classList.add('hidden');
        });
    }

    // Standard Modal Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const res = window.smartUpsAuth.login(email, password);
            if (res.success) {
                window.showToast(`Welcome back, ${res.user.name}!`, "success");
                closeLoginModal();
            } else {
                window.showToast(res.message, "danger");
            }
        });
    }

    // Standard Modal Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const role = document.getElementById('regRole').value;

            const res = window.smartUpsAuth.register(name, email, password, role);
            if (res.success) {
                window.showToast(`Account created! Logged in as ${res.user.name}.`, "success");
                closeLoginModal();
            } else {
                window.showToast(res.message, "warning");
            }
        });
    }

    // Modal Tabs
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');
    const boxLogin = document.getElementById('authLoginBox');
    const boxRegister = document.getElementById('authRegisterBox');

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('text-cyan-400', 'border-cyan-400');
            tabLogin.classList.remove('text-gray-400', 'border-transparent');
            tabRegister.classList.remove('text-cyan-400', 'border-cyan-400');
            tabRegister.classList.add('text-gray-400', 'border-transparent');
            boxLogin.classList.remove('hidden');
            boxRegister.classList.add('hidden');
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('text-cyan-400', 'border-cyan-400');
            tabRegister.classList.remove('text-gray-400', 'border-transparent');
            tabLogin.classList.remove('text-cyan-400', 'border-cyan-400');
            tabLogin.classList.add('text-gray-400', 'border-transparent');
            boxRegister.classList.remove('hidden');
            boxLogin.classList.add('hidden');
        });
    }

    // Logout button
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            window.smartUpsAuth.logout();
            closeLoginModal();
            window.showToast("Signed out. Authentication required to access system.", "info");
        });
    }
}

function updateAuthUI() {
    const isAuth = window.smartUpsAuth.isAuthenticated();
    const user = window.smartUpsAuth.getCurrentUser();
    const gateScreen = document.getElementById('authGateScreen');
    const appDashboard = document.getElementById('appDashboard');

    if (!isAuth) {
        if (gateScreen) {
            gateScreen.classList.remove('hidden');
            gateScreen.classList.add('flex');
        }
        if (appDashboard) {
            appDashboard.classList.add('hidden');
        }
        return;
    } else {
        if (gateScreen) {
            gateScreen.classList.add('hidden');
            gateScreen.classList.remove('flex');
        }
        if (appDashboard) {
            appDashboard.classList.remove('hidden');
        }
    }

    const userName = document.getElementById('headerUserName');
    const userRole = document.getElementById('headerUserRole');
    const userAvatar = document.getElementById('headerUserAvatar');
    const pairBtn = document.getElementById('btnOpenPairing');

    if (user) {
        if (userName) userName.textContent = user.name;
        if (userRole) {
            const roleLabels = {
                energy_engineer: "ENERGY ENGINEER",
                business_owner: "BUSINESS OWNER",
                household_resident: "HOUSEHOLD RESIDENT",
                office_worker: "OFFICE WORKER",
                student: "STUDENT",
                admin: "ADMINISTRATOR"
            };
            const roleClasses = {
                energy_engineer: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
                business_owner: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
                household_resident: "bg-teal-500/20 text-teal-300 border border-teal-500/40",
                office_worker: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
                student: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
                admin: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
            };
            userRole.textContent = roleLabels[user.role] || (user.role || '').toUpperCase();
            userRole.className = `text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono ${roleClasses[user.role] || 'bg-gray-700 text-gray-300'}`;
        }
        if (userAvatar) userAvatar.textContent = user.avatar || "⚡";
    }

    // Disable or enable pairing button based on permissions
    if (pairBtn) {
        if (window.smartUpsAuth.canPair()) {
            pairBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            pairBtn.title = "Enroll new Smart Switch or Socket";
        } else {
            pairBtn.classList.add('opacity-50');
            pairBtn.title = "Admin privileges required to pair devices";
        }
    }
}

// -------------------------------------------------------------
// Telemetry & Dashboard Sync
// -------------------------------------------------------------
function setupEngineListeners() {
    window.smartUpsEngine.onUpdate((data) => {
        renderDashboard(data);
    });
}

function renderDashboard(data) {
    if (!window.smartUpsAuth.isAuthenticated()) return;
    const isBlackout = data.ups.isSimulatedBlackout;
    const { totalWatts, percentCapacity, totalAmps } = window.smartUpsEngine.calculateTotalLoad();
    const runtimeMins = window.smartUpsEngine.calculateRuntimeMinutes();

    // 1. Grid Status Badge
    const statusBadge = document.getElementById('upsStatusBadge');
    const statusText = document.getElementById('upsStatusText');
    const statusIcon = document.getElementById('upsStatusIcon');

    if (statusBadge && statusText) {
        if (isBlackout) {
            statusBadge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold animate-pulse";
            statusText.textContent = "ON BATTERY INVERTER (GRID DOWN)";
            if (statusIcon) statusIcon.textContent = "🚨";
        } else {
            statusBadge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold";
            statusText.textContent = "GRID ONLINE • PURE SINE";
            if (statusIcon) statusIcon.textContent = "⚡";
        }
    }

    // 2. Core Metrics
    safeSetText('metricInputVoltage', `${data.ups.gridVoltage.toFixed(1)} V`);
    safeSetText('metricOutputVoltage', `${data.ups.outputVoltage.toFixed(1)} V`);
    safeSetText('metricFrequency', `${data.ups.gridFrequency.toFixed(2)} Hz`);
    safeSetText('metricTotalLoad', `${totalWatts} W`);
    safeSetText('metricTotalAmps', `${totalAmps} A`);
    safeSetText('metricLoadPercent', `${percentCapacity}%`);

    // Load progress bar
    const loadBar = document.getElementById('loadCapacityBar');
    if (loadBar) {
        loadBar.style.width = `${percentCapacity}%`;
        if (percentCapacity > 80) {
            loadBar.className = "h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-rose-500";
        } else {
            loadBar.className = "h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 to-emerald-400";
        }
    }

    // 3. Battery Metrics
    const battLevel = Math.round(data.ups.batteryLevel);
    safeSetText('metricBatteryLevel', `${battLevel}%`);
    safeSetText('metricBatteryVoltage', `${data.ups.batteryVoltage} V`);
    safeSetText('metricBatteryHealth', `${data.ups.batteryHealth}%`);
    safeSetText('metricBatteryTemp', `${data.ups.batteryTemp}°C`);

    // Runtime formatted (HH:MM or mins)
    const hours = Math.floor(runtimeMins / 60);
    const mins = runtimeMins % 60;
    const runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    safeSetText('metricEstimatedRuntime', runtimeStr);

    // Battery bar gauge
    const batteryBar = document.getElementById('batteryBarFill');
    if (batteryBar) {
        batteryBar.style.width = `${battLevel}%`;
        if (battLevel < 20) {
            batteryBar.className = "h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-600 to-rose-400";
        } else if (battLevel < 50) {
            batteryBar.className = "h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-600 to-amber-400";
        } else {
            batteryBar.className = "h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-600 to-emerald-400";
        }
    }

    // 4. Power Flow Circuit Animation
    updatePowerFlowDiagram(isBlackout, battLevel, totalWatts);

    // 5. Switches List
    renderSwitchesList(data.switches);

    // 6. Outlets List
    renderOutletsList(data.outlets);

    // 7. Event Logs
    renderLogsList(data.logs);

    // 8. Push point to chart
    if (window.smartUpsCharts) {
        window.smartUpsCharts.pushTelemetryPoint(totalWatts, battLevel);
    }
}

// -------------------------------------------------------------
// Interactive Power Flow Circuit
// -------------------------------------------------------------
function updatePowerFlowDiagram(isBlackout, battLevel, totalWatts) {
    const gridNode = document.getElementById('pfGridNode');
    const batteryNode = document.getElementById('pfBatteryNode');
    const inverterNode = document.getElementById('pfInverterNode');
    const loadNode = document.getElementById('pfLoadNode');

    const wireGridToInverter = document.getElementById('wireGridToInverter');
    const wireBatteryToInverter = document.getElementById('wireBatteryToInverter');
    const wireInverterToLoad = document.getElementById('wireInverterToLoad');

    if (isBlackout) {
        // Grid is DEAD
        if (gridNode) {
            gridNode.classList.remove('border-emerald-500', 'shadow-emerald-500/20');
            gridNode.classList.add('border-rose-500/50', 'bg-rose-950/40', 'opacity-60');
        }
        if (wireGridToInverter) {
            wireGridToInverter.classList.remove('stroke-emerald-400', 'dash-animate');
            wireGridToInverter.classList.add('stroke-gray-700');
        }

        // Battery is SUPPLYING INVERTER
        if (batteryNode) {
            batteryNode.classList.add('border-amber-500', 'shadow-lg', 'shadow-amber-500/20', 'animate-pulse');
        }
        if (wireBatteryToInverter) {
            wireBatteryToInverter.classList.remove('stroke-gray-700');
            wireBatteryToInverter.classList.add('stroke-amber-400', 'dash-animate');
        }
    } else {
        // Grid is ACTIVE
        if (gridNode) {
            gridNode.classList.add('border-emerald-500', 'shadow-lg', 'shadow-emerald-500/20');
            gridNode.classList.remove('border-rose-500/50', 'bg-rose-950/40', 'opacity-60');
        }
        if (wireGridToInverter) {
            wireGridToInverter.classList.add('stroke-emerald-400', 'dash-animate');
            wireGridToInverter.classList.remove('stroke-gray-700');
        }

        // Battery is CHARGING or IDLE
        if (batteryNode) {
            batteryNode.classList.remove('border-amber-500', 'shadow-lg', 'shadow-amber-500/20', 'animate-pulse');
            if (battLevel < 100) {
                batteryNode.classList.add('border-cyan-500/60');
            }
        }
        if (wireBatteryToInverter) {
            if (battLevel < 100) {
                wireBatteryToInverter.classList.add('stroke-cyan-400', 'dash-animate-reverse');
                wireBatteryToInverter.classList.remove('stroke-gray-700', 'stroke-amber-400');
            } else {
                wireBatteryToInverter.classList.remove('stroke-amber-400', 'dash-animate', 'dash-animate-reverse');
                wireBatteryToInverter.classList.add('stroke-gray-700');
            }
        }
    }

    // Inverter to Load wire
    if (wireInverterToLoad) {
        if (totalWatts > 0) {
            wireInverterToLoad.classList.add('stroke-cyan-400', 'dash-animate');
            wireInverterToLoad.classList.remove('stroke-gray-700');
        } else {
            wireInverterToLoad.classList.remove('stroke-cyan-400', 'dash-animate');
            wireInverterToLoad.classList.add('stroke-gray-700');
        }
    }
}

// -------------------------------------------------------------
// Render Smart Switches
// -------------------------------------------------------------
function renderSwitchesList(switches) {
    const container = document.getElementById('switchesListContainer');
    if (!container) return;

    if (!switches || switches.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-10 px-6 rounded-2xl border border-dashed border-cyan-500/30 bg-slate-950/40 text-center space-y-3 animate-fade-in">
                <div class="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-2xl text-cyan-400">⚡</div>
                <div>
                    <h4 class="text-sm font-bold text-white tracking-wide">No Smart Switches Paired</h4>
                    <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">Your account starts with a clean power topology. You have full freedom to enroll switches, breakers, and high-load relays as you wish!</p>
                </div>
                <button type="button" class="btn-pair-switch-empty px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer">
                    ＋ Pair Your First Smart Switch
                </button>
            </div>
        `;
        container.querySelector('.btn-pair-switch-empty')?.addEventListener('click', () => {
            window.smartUpsPairing.openForType('switch');
        });
        return;
    }

    // Check if user has filter active
    const activeFilter = document.querySelector('.btn-switch-filter.active')?.dataset.filter || 'all';

    const filtered = switches.filter(sw => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'on') return sw.state;
        if (activeFilter === 'off') return !sw.state;
        return true;
    });

    container.innerHTML = filtered.map(sw => {
        const canToggle = window.smartUpsAuth.canToggle();
        const isAdmin = window.smartUpsAuth.isAdmin();

        return `
            <div class="p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                sw.state
                    ? 'bg-gray-800/80 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                    : 'bg-gray-900/60 border-gray-800 opacity-80'
            }">
                ${sw.isNewlyPaired ? `<span class="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-black animate-pulse">NEW</span>` : ''}

                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                            sw.state ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-500'
                        }">
                            ⚡
                        </div>
                        <div>
                            <h4 class="font-bold text-white text-sm tracking-wide">${sw.name}</h4>
                            <div class="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <span class="text-gray-400 font-mono">${sw.room}</span>
                                <span>•</span>
                                <span class="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono ${
                                    sw.priority === 'critical' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' :
                                    sw.priority === 'essential' ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' :
                                    'bg-gray-800 text-gray-400'
                                }">${sw.priority}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-1">
                        <!-- Lock Toggle for Admin -->
                        ${isAdmin ? `
                            <button class="btn-toggle-lock p-1.5 rounded-lg text-xs transition-colors ${
                                sw.locked ? 'text-amber-400 bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/50' : 'text-gray-500 hover:text-gray-300'
                            }" data-id="${sw.id}" title="${sw.locked ? 'Locked: Click to unlock' : 'Unlocked: Click to lock'}">
                                ${sw.locked ? '🔒' : '🔓'}
                            </button>
                        ` : (sw.locked ? `<span class="text-xs text-amber-400" title="Safety Breaker Locked">🔒</span>` : '')}

                        <!-- Remove Switch Button -->
                        <button class="btn-delete-switch p-1 rounded-lg text-gray-500 hover:text-rose-400 text-xs transition-colors cursor-pointer" data-id="${sw.id}" title="Remove switch">
                            ✕
                        </button>
                    </div>
                </div>

                <!-- Live Power & Status -->
                <div class="flex items-center justify-between pt-3 border-t border-gray-700/50 text-xs">
                    <div>
                        <span class="text-gray-400">Load:</span>
                        <span class="font-mono font-bold ${sw.state ? 'text-cyan-300' : 'text-gray-500'} ml-1">
                            ${sw.state ? sw.currentLoadWatts : 0} W
                        </span>
                        <span class="text-gray-500 text-[11px] ml-1">(${sw.ratedAmps}A rated)</span>
                    </div>

                    <!-- Modern Toggle Switch Button -->
                    <button class="btn-toggle-switch flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer ${
                        sw.state
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/30'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                    } ${!canToggle || (sw.locked && !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}" data-id="${sw.id}">
                        <span class="w-2 h-2 rounded-full ${sw.state ? 'bg-black animate-ping' : 'bg-gray-500'}"></span>
                        <span>${sw.state ? 'ACTIVE' : 'OFF'}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Attach switch event listeners
    container.querySelectorAll('.btn-toggle-switch').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const res = window.smartUpsEngine.toggleSwitch(id);
            if (!res.success) {
                window.showToast(res.message, "warning");
            }
        });
    });

    container.querySelectorAll('.btn-toggle-lock').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const res = window.smartUpsEngine.toggleSwitchLock(id);
            if (!res.success) {
                window.showToast(res.message, "warning");
            }
        });
    });

    container.querySelectorAll('.btn-delete-switch').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (confirm("Remove this switch from your dashboard?")) {
                window.smartUpsEngine.deleteDevice('switch', id);
                window.showToast("Switch removed from dashboard.", "info");
            }
        });
    });
}

// -------------------------------------------------------------
// Render Smart Sockets Outlets
// -------------------------------------------------------------
function renderOutletsList(outlets) {
    const container = document.getElementById('outletsListContainer');
    if (!container) return;

    if (!outlets || outlets.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-10 px-6 rounded-2xl border border-dashed border-emerald-500/30 bg-slate-950/40 text-center space-y-3 animate-fade-in">
                <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-2xl text-emerald-400">🔌</div>
                <div>
                    <h4 class="text-sm font-bold text-white tracking-wide">No Smart Socket Outlets Paired</h4>
                    <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">No socket outlets configured yet. Add dual-port sockets, smart plugs, or appliances as you wish!</p>
                </div>
                <button type="button" class="btn-pair-outlet-empty px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
                    ＋ Pair Your First Smart Socket
                </button>
            </div>
        `;
        container.querySelector('.btn-pair-outlet-empty')?.addEventListener('click', () => {
            window.smartUpsPairing.openForType('outlet');
        });
        return;
    }

    container.innerHTML = outlets.map(sock => {
        const canToggle = window.smartUpsAuth.canToggle();

        const priorityBadge = {
            critical: "bg-rose-950/60 text-rose-300 border-rose-500/40",
            essential: "bg-amber-950/60 text-amber-300 border-amber-500/40",
            "non-essential": "bg-gray-800/80 text-gray-400 border-gray-700"
        }[sock.priority] || "bg-gray-800 text-gray-400";

        return `
            <div class="p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                sock.state
                    ? 'bg-gray-800/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-gray-900/60 border-gray-800 opacity-70'
            }">
                ${sock.isNewlyPaired ? `<span class="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-black animate-pulse">NEW</span>` : ''}

                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                            sock.state ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500'
                        }">
                            🔌
                        </div>
                        <div>
                            <h4 class="font-bold text-white text-sm">${sock.name}</h4>
                            <div class="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <span>${sock.room}</span>
                                <span>•</span>
                                <span class="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono border ${priorityBadge}">
                                    ${sock.priority}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Power Toggle -->
                    <button class="btn-toggle-outlet w-12 h-6 rounded-full transition-colors duration-300 relative p-0.5 cursor-pointer ${
                        sock.state ? 'bg-emerald-500' : 'bg-gray-700'
                    } ${!canToggle ? 'opacity-50 cursor-not-allowed' : ''}" data-id="${sock.id}" title="${sock.state ? 'Cut Power' : 'Turn On'}">
                        <div class="w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                            sock.state ? 'translate-x-6' : 'translate-x-0'
                        }"></div>
                    </button>
                </div>

                <!-- Telemetry Readout Grid -->
                <div class="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-gray-900/80 border border-gray-800 text-center font-mono my-3">
                    <div>
                        <div class="text-[10px] text-gray-500 uppercase">Power</div>
                        <div class="text-sm font-bold ${sock.state ? 'text-emerald-400' : 'text-gray-600'}">
                            ${sock.state ? sock.powerWatts : 0} <span class="text-[10px] font-normal">W</span>
                        </div>
                    </div>
                    <div>
                        <div class="text-[10px] text-gray-500 uppercase">Current</div>
                        <div class="text-sm font-bold ${sock.state ? 'text-cyan-400' : 'text-gray-600'}">
                            ${sock.state ? sock.currentAmps : 0} <span class="text-[10px] font-normal">A</span>
                        </div>
                    </div>
                    <div>
                        <div class="text-[10px] text-gray-500 uppercase">Daily</div>
                        <div class="text-sm font-bold text-gray-300">
                            ${sock.dailyKwh} <span class="text-[10px] font-normal">kWh</span>
                        </div>
                    </div>
                </div>

                <!-- Bottom Bar with Timer & Remove options -->
                <div class="flex items-center justify-between text-xs text-gray-400 pt-1">
                    <div class="flex items-center gap-1.5">
                        <span>⏱️</span>
                        <span>${sock.timerMinutesRemaining ? `${Math.ceil(sock.timerMinutesRemaining)}m timer` : sock.schedule}</span>
                    </div>

                    <button class="btn-delete-socket text-[11px] text-gray-500 hover:text-rose-400 transition-colors cursor-pointer" data-id="${sock.id}" title="Remove socket node">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Attach socket event listeners
    container.querySelectorAll('.btn-toggle-outlet').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const res = window.smartUpsEngine.toggleOutlet(id);
            if (!res.success) {
                window.showToast(res.message, "warning");
            }
        });
    });

    container.querySelectorAll('.btn-delete-socket').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (confirm("Remove this smart outlet from your dashboard?")) {
                window.smartUpsEngine.deleteDevice('outlet', id);
                window.showToast("Socket outlet removed from dashboard.", "info");
            }
        });
    });
}

// -------------------------------------------------------------
// Render Activity Logs
// -------------------------------------------------------------
function renderLogsList(logs) {
    const container = document.getElementById('activityLogsList');
    if (!container) return;

    container.innerHTML = logs.slice(0, 7).map(log => {
        const typeColors = {
            info: "text-cyan-400 bg-cyan-950/40 border-cyan-500/20",
            success: "text-emerald-400 bg-emerald-950/40 border-emerald-500/20",
            warning: "text-amber-400 bg-amber-950/40 border-amber-500/20",
            danger: "text-rose-400 bg-rose-950/40 border-rose-500/20"
        }[log.type] || "text-gray-400 bg-gray-800";

        return `
            <div class="flex items-center justify-between py-2 border-b border-gray-800/80 text-xs font-mono">
                <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded text-[10px] uppercase border ${typeColors}">${log.type}</span>
                    <span class="text-gray-300">${log.text}</span>
                </div>
                <span class="text-gray-500 text-[11px]">${log.time}</span>
            </div>
        `;
    }).join('');
}

// -------------------------------------------------------------
// Blackout Simulator Controls
// -------------------------------------------------------------
function setupSimulatorControls() {
    const btnSimulate = document.getElementById('btnSimulateBlackout');
    if (!btnSimulate) return;

    btnSimulate.addEventListener('click', () => {
        const current = window.smartUpsEngine.data.ups.isSimulatedBlackout;
        const next = !current;
        window.smartUpsEngine.setBlackoutSimulation(next);

        if (next) {
            btnSimulate.innerHTML = `<span>🚨</span><span>RESTORE UTILITY GRID POWER</span>`;
            btnSimulate.className = "flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer animate-pulse";
            window.showToast("⚡ SIMULATED POWER OUTAGE: Utility grid dropped! Non-essential circuits auto-shed.", "warning");
        } else {
            btnSimulate.innerHTML = `<span>⚡</span><span>SIMULATE POWER OUTAGE (BLACKOUT)</span>`;
            btnSimulate.className = "flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer";
            window.showToast("Grid AC power restored. Smart UPS returning to float charge.", "success");
        }
    });

    // Sound toggle button
    const btnSound = document.getElementById('btnToggleSound');
    if (btnSound) {
        btnSound.addEventListener('click', () => {
            const enabled = window.smartUpsEngine.toggleSound();
            btnSound.textContent = enabled ? '🔊 Audio ON' : '🔇 Audio Muted';
            window.showToast(enabled ? "Relay & alarm audio enabled." : "Audio muted.", "info");
        });
    }
}

// -------------------------------------------------------------
// Quick Actions (All On / All Off)
// -------------------------------------------------------------
function setupQuickActions() {
    const btnAllSwitchesOn = document.getElementById('btnAllSwitchesOn');
    const btnAllSwitchesOff = document.getElementById('btnAllSwitchesOff');

    if (btnAllSwitchesOn) {
        btnAllSwitchesOn.addEventListener('click', () => {
            window.smartUpsEngine.setAllSwitches(true);
            window.showToast("All unlocked switches energized.", "info");
        });
    }

    if (btnAllSwitchesOff) {
        btnAllSwitchesOff.addEventListener('click', () => {
            window.smartUpsEngine.setAllSwitches(false);
            window.showToast("All unlocked switches opened.", "warning");
        });
    }

    const btnAllOutletsOn = document.getElementById('btnAllOutletsOn');
    const btnAllOutletsOff = document.getElementById('btnAllOutletsOff');

    if (btnAllOutletsOn) {
        btnAllOutletsOn.addEventListener('click', () => {
            window.smartUpsEngine.setAllOutlets(true);
            window.showToast("All socket outlets activated.", "info");
        });
    }

    if (btnAllOutletsOff) {
        btnAllOutletsOff.addEventListener('click', () => {
            window.smartUpsEngine.setAllOutlets(false);
            window.showToast("All socket outlets cut off.", "warning");
        });
    }
}

// -------------------------------------------------------------
// Modal Dialogs
// -------------------------------------------------------------
function setupModalHandlers() {
    const btnOpenAuth = document.getElementById('btnOpenAuth');
    const modalAuth = document.getElementById('authModal');
    const btnCloseAuth = document.getElementById('btnCloseAuth');

    if (btnOpenAuth && modalAuth) {
        btnOpenAuth.addEventListener('click', () => {
            modalAuth.classList.remove('hidden');
            modalAuth.classList.add('flex');
        });
    }

    if (btnCloseAuth && modalAuth) {
        btnCloseAuth.addEventListener('click', () => {
            closeLoginModal();
        });
    }
}

function closeLoginModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
