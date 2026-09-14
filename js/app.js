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
    setupBatteryAlertHandlers();

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

    // Toggle Password Visibility (Eye buttons)
    document.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
                btn.title = 'Hide Password';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
                btn.title = 'Show Password';
            }
        });
    });

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
    const tabProfile = document.getElementById('tabAuthProfile');
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');

    if (tabProfile) {
        tabProfile.addEventListener('click', () => switchAuthTab('profile'));
    }
    if (tabLogin) {
        tabLogin.addEventListener('click', () => switchAuthTab('login'));
    }
    if (tabRegister) {
        tabRegister.addEventListener('click', () => switchAuthTab('register'));
    }

    const btnBackLogin = document.getElementById('btnBackToProfileFromLogin');
    if (btnBackLogin) {
        btnBackLogin.addEventListener('click', () => switchAuthTab('profile'));
    }

    const btnBackReg = document.getElementById('btnBackToProfileFromReg');
    if (btnBackReg) {
        btnBackReg.addEventListener('click', () => switchAuthTab('profile'));
    }

    const btnSwitchAccountFromProfile = document.getElementById('btnSwitchAccountFromProfile');
    if (btnSwitchAccountFromProfile) {
        btnSwitchAccountFromProfile.addEventListener('click', () => switchAuthTab('login'));
    }

    const btnLogoutProfile = document.getElementById('btnLogoutProfile');
    if (btnLogoutProfile) {
        btnLogoutProfile.addEventListener('click', () => {
            window.smartUpsAuth.logout();
            closeLoginModal();
            window.showToast("Signed out. Authentication required to access system.", "info");
        });
    }

    // Logout button in switch account form
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            window.smartUpsAuth.logout();
            closeLoginModal();
            window.showToast("Signed out. Authentication required to access system.", "info");
        });
    }
}

function openProfileModal() {
    const modalAuth = document.getElementById('authModal');
    if (!modalAuth) return;

    renderProfileView();
    switchAuthTab('profile');

    modalAuth.classList.remove('hidden');
    modalAuth.classList.add('flex');
}

function switchAuthTab(tabName) {
    const tabProfile = document.getElementById('tabAuthProfile');
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');

    const boxProfile = document.getElementById('authProfileBox');
    const boxLogin = document.getElementById('authLoginBox');
    const boxRegister = document.getElementById('authRegisterBox');

    const titleIcon = document.getElementById('authModalTitleIcon');
    const titleText = document.getElementById('authModalTitleText');
    const subtitle = document.getElementById('authModalSubtitle');

    const activeClasses = ['text-cyan-400', 'border-cyan-400'];
    const inactiveClasses = ['text-slate-400', 'border-transparent'];

    [tabProfile, tabLogin, tabRegister].forEach(t => {
        if (!t) return;
        t.classList.remove(...activeClasses);
        t.classList.add(...inactiveClasses);
    });

    if (boxProfile) boxProfile.classList.add('hidden');
    if (boxLogin) boxLogin.classList.add('hidden');
    if (boxRegister) boxRegister.classList.add('hidden');

    if (tabName === 'profile') {
        if (tabProfile) {
            tabProfile.classList.add(...activeClasses);
            tabProfile.classList.remove(...inactiveClasses);
        }
        if (boxProfile) boxProfile.classList.remove('hidden');
        if (titleIcon) titleIcon.textContent = '👤';
        if (titleText) titleText.textContent = 'User Profile';
        if (subtitle) subtitle.textContent = 'Active session credentials & role permissions';
        renderProfileView();
    } else if (tabName === 'login') {
        if (tabLogin) {
            tabLogin.classList.add(...activeClasses);
            tabLogin.classList.remove(...inactiveClasses);
        }
        if (boxLogin) boxLogin.classList.remove('hidden');
        if (titleIcon) titleIcon.textContent = '🔐';
        if (titleText) titleText.textContent = 'Switch Account';
        if (subtitle) subtitle.textContent = 'Sign in with credentials or demo profiles';
    } else if (tabName === 'register') {
        if (tabRegister) {
            tabRegister.classList.add(...activeClasses);
            tabRegister.classList.remove(...inactiveClasses);
        }
        if (boxRegister) boxRegister.classList.remove('hidden');
        if (titleIcon) titleIcon.textContent = '✨';
        if (titleText) titleText.textContent = 'Register New Account';
        if (subtitle) subtitle.textContent = 'Create a custom household or business profile';
    }
}

function renderProfileView() {
    const user = window.smartUpsAuth.getCurrentUser();
    if (!user) return;

    const elAvatar = document.getElementById('profileAvatar');
    const elName = document.getElementById('profileFullName');
    const elEmail = document.getElementById('profileEmail');
    const elBadge = document.getElementById('profileRoleBadge');
    const elType = document.getElementById('profileAccountType');
    const elPermToggle = document.getElementById('permToggle');
    const elPermPair = document.getElementById('permPair');
    const elPermConfig = document.getElementById('permConfig');
    const elPermLock = document.getElementById('permAdminLock');

    if (elAvatar) elAvatar.textContent = user.avatar || "⚡";
    if (elName) elName.textContent = user.name || "SmartUps User";
    if (elEmail) elEmail.textContent = user.email || "user@smartups.io";

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

    if (elBadge) {
        elBadge.textContent = roleLabels[user.role] || (user.role || '').toUpperCase();
        elBadge.className = `text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono ${roleClasses[user.role] || 'bg-gray-700 text-gray-300 border border-gray-600'}`;
    }

    if (elType) {
        elType.textContent = user.isCustomAccount ? "Personal Account" : (user.title || "Demo Profile");
    }

    const canToggle = window.smartUpsAuth.canToggle();
    const canPair = window.smartUpsAuth.canPair();
    const canConfig = window.smartUpsAuth.canConfigure();
    const isAdmin = window.smartUpsAuth.isAdmin();

    if (elPermToggle) {
        elPermToggle.textContent = canToggle ? "ENABLED" : "RESTRICTED";
        elPermToggle.className = `px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            canToggle ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-gray-800 text-gray-400 border border-gray-700"
        }`;
    }

    if (elPermPair) {
        elPermPair.textContent = canPair ? "ENABLED" : "RESTRICTED";
        elPermPair.className = `px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            canPair ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-gray-800 text-gray-400 border border-gray-700"
        }`;
    }

    if (elPermConfig) {
        elPermConfig.textContent = canConfig ? "ENABLED" : "VIEW ONLY";
        elPermConfig.className = `px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            canConfig ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-gray-800 text-gray-400 border border-gray-700"
        }`;
    }

    if (elPermLock) {
        elPermLock.textContent = isAdmin ? "FULL ACCESS" : "RESTRICTED";
        elPermLock.className = `px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            isAdmin ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-gray-800 text-gray-400 border border-gray-700"
        }`;
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
        renderProfileView();
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
    safeSetText('metricTotalAmps', `${totalAmps.toFixed(2)} A`);
    safeSetText('metricLoadPercent', `${percentCapacity}%`);

    // Load progress bar
    const loadBar = document.getElementById('loadCapacityBar');
    if (loadBar) {
        loadBar.style.width = `${percentCapacity}%`;
        if (percentCapacity > 80) {
            loadBar.className = "h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-rose-500";
        } else if (percentCapacity > 0) {
            loadBar.className = "h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 to-emerald-400";
        } else {
            loadBar.className = "h-full rounded-full transition-all duration-500 bg-slate-800";
        }
    }

    // 3. Battery Metrics
    const battLevel = Math.round(data.ups.batteryLevel);
    safeSetText('metricBatteryLevel', `${battLevel}%`);
    safeSetText('metricBatteryVoltage', `${data.ups.batteryVoltage} V`);
    safeSetText('metricBatteryHealth', `${data.ups.batteryHealth}%`);
    safeSetText('metricBatteryTemp', `${data.ups.batteryTemp}°C`);

    // Runtime formatted (0m when totalWatts is 0)
    let runtimeStr = "0m";
    if (runtimeMins > 0) {
        const hours = Math.floor(runtimeMins / 60);
        const mins = runtimeMins % 60;
        runtimeStr = hours > 0 ? `${hours}h ${mins < 10 ? '0' : ''}${mins}m` : `${mins}m`;
    } else {
        runtimeStr = "0m";
    }
    safeSetText('metricEstimatedRuntime', runtimeStr);

    const runtimeSub = document.getElementById('metricEstimatedRuntimeSub');
    if (runtimeSub) {
        runtimeSub.textContent = totalWatts > 0 ? "at active load" : "(no load)";
    }

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
        if (container.querySelector('.btn-pair-switch-empty')) {
            return; // Already rendered: prevent DOM recreation and pulsing
        }
        container.innerHTML = `
            <div class="col-span-full py-10 px-6 rounded-2xl border border-dashed border-cyan-500/30 bg-slate-950/40 text-center space-y-3">
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

    // Signature checking to prevent unnecessary DOM thrashing and pulsing on ticks
    const renderSignature = JSON.stringify({
        switches: (switches || []).map(s => ({
            id: s.id,
            state: s.state,
            locked: s.locked,
            name: s.name,
            load: s.currentLoadWatts,
            priority: s.priority,
            sections: (s.sections || []).map(sec => ({ id: sec.id, state: sec.state, label: sec.label, watts: sec.watts }))
        })),
        filter: activeFilter,
        role: window.smartUpsAuth?.currentUser?.role
    });

    if (container.dataset.lastSignature === renderSignature) {
        return; // UI state is identical, skip DOM rebuild
    }
    container.dataset.lastSignature = renderSignature;

    const filtered = switches.filter(sw => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'on') return sw.state;
        if (activeFilter === 'off') return !sw.state;
        return true;
    });

    container.innerHTML = filtered.map(sw => {
        const canToggle = window.smartUpsAuth.canToggle();
        const isAdmin = window.smartUpsAuth.isAdmin();
        const sections = sw.sections && Array.isArray(sw.sections) && sw.sections.length > 0
            ? sw.sections
            : (typeof ensureSwitchSections === 'function' ? ensureSwitchSections(sw) : [{ id: 1, label: "Default Section", state: sw.state, watts: sw.currentLoadWatts }]);

        const activeSecCount = sections.filter(s => s.state).length;

        return `
            <div class="p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                sw.state
                    ? 'bg-gray-800/80 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                    : 'bg-gray-900/60 border-gray-800 opacity-80'
            }">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                            sw.state ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-500'
                        }">
                            ⚡
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-white text-sm tracking-wide">${sw.name}</h4>
                                ${sw.isNewlyPaired ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-400 text-black animate-pulse leading-none tracking-wider">NEW</span>` : ''}
                            </div>
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

                <!-- Live Power & Master Status -->
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

                <!-- Multi-Channel Sections / Gangs (1, 2, 3, 4) Under Card (Reference Drawing) -->
                <div class="pt-3 mt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] text-slate-400 font-mono uppercase tracking-wider mr-1">Sections:</span>
                        ${sections.map(sec => `
                            <button type="button" 
                                    class="btn-toggle-sec w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${
                                        sec.state
                                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400/40 hover:bg-cyan-500/35'
                                            : 'bg-slate-900/90 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                                    } ${!canToggle || (sw.locked && !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}"
                                    data-switch-id="${sw.id}"
                                    data-section-id="${sec.id}"
                                    title="Section ${sec.id}: ${sec.label} (${sec.state ? (sec.watts || 0) + 'W • ON' : 'OFF'})">
                                ${sec.id}
                            </button>
                        `).join('')}

                        <!-- Add Section (+) button if fewer than 4 sections -->
                        ${sections.length < 4 ? `
                            <button type="button" 
                                    class="btn-add-switch-section w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer border border-dashed border-slate-700 hover:border-cyan-400 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300"
                                    data-switch-id="${sw.id}"
                                    title="Add Section ${sections.length + 1} with custom label">
                                ＋
                            </button>
                        ` : ''}
                    </div>

                    <!-- Active Section Counter & Inline Rename -->
                    <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span class="font-mono text-[10px] ${activeSecCount > 0 ? 'text-cyan-400 font-semibold' : 'text-slate-500'}">
                            ${activeSecCount}/${sections.length} Active
                        </span>
                        <button type="button" 
                                class="btn-rename-switch-sec p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 text-xs transition-colors cursor-pointer" 
                                data-switch-id="${sw.id}" 
                                title="Rename section labels for this switch">
                            ✏️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('') + `
        <div class="btn-pair-more-switch p-5 rounded-2xl border border-dashed border-cyan-500/30 hover:border-cyan-400/80 bg-slate-950/40 hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[170px] group shadow-sm">
            <div class="w-11 h-11 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 group-hover:border-cyan-400 group-hover:bg-cyan-500/20 flex items-center justify-center text-xl text-cyan-400 transition-all mb-2 group-hover:scale-105">＋</div>
            <h4 class="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Add More Switches</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">Pair another breaker or smart relay</p>
            <button type="button" class="mt-3 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-xs font-bold text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-all cursor-pointer">＋ Add More</button>
        </div>
    `;

    // Attach Add More Switch listener
    container.querySelectorAll('.btn-pair-more-switch').forEach(btn => {
        btn.addEventListener('click', () => {
            window.smartUpsPairing.openForType('switch');
        });
    });

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

    // Attach Individual Sub-Channel Section Toggle
    container.querySelectorAll('.btn-toggle-sec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const swId = btn.dataset.switchId;
            const secId = parseInt(btn.dataset.sectionId, 10);
            const res = window.smartUpsEngine.toggleSwitchSection(swId, secId);
            if (!res.success) {
                window.showToast(res.message, "warning");
            }
        });
    });

    // Attach Add Section Button (+) on Card
    container.querySelectorAll('.btn-add-switch-section').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const swId = btn.dataset.switchId;
            const sw = (window.smartUpsEngine?.data?.switches || switches).find(s => s.id === swId);
            const nextId = (sw && sw.sections ? sw.sections.length : 0) + 1;
            const defaultLabel = nextId === 1 ? "Default Section" : `Section ${nextId}`;
            const label = prompt(`Enter label for Section ${nextId}:`, defaultLabel);
            if (label !== null && label.trim().length > 0) {
                const res = window.smartUpsEngine.addSwitchSection(swId, label.trim());
                if (res.success) {
                    window.showToast(`Section ${nextId} ("${label.trim()}") added to ${sw ? sw.name : 'switch'}!`, "success");
                } else {
                    window.showToast(res.message, "warning");
                }
            }
        });
    });

    // Attach Rename Section Button (✏️) on Card
    container.querySelectorAll('.btn-rename-switch-sec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const swId = btn.dataset.switchId;
            const sw = switches.find(s => s.id === swId);
            if (!sw || !sw.sections || sw.sections.length === 0) return;

            let secNum = 1;
            if (sw.sections.length > 1) {
                const optionsList = sw.sections.map(s => `${s.id}: ${s.label}`).join('\n');
                const secNumStr = prompt(`Which section do you want to rename?\n${optionsList}\n\nEnter section number (1-${sw.sections.length}):`, "1");
                if (!secNumStr) return;
                secNum = parseInt(secNumStr, 10);
            }

            const targetSec = sw.sections.find(s => s.id === secNum);
            if (!targetSec) {
                window.showToast(`Section ${secNum} not found.`, "warning");
                return;
            }

            const newLabel = prompt(`Enter new label for Section ${secNum}:`, targetSec.label);
            if (newLabel !== null && newLabel.trim().length > 0) {
                window.smartUpsEngine.renameSwitchSection(swId, secNum, newLabel.trim());
                window.showToast(`Section ${secNum} renamed to "${newLabel.trim()}".`, "success");
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
        if (container.querySelector('.btn-pair-outlet-empty')) {
            return; // Already rendered: prevent DOM recreation and pulsing
        }
        container.innerHTML = `
            <div class="col-span-full py-10 px-6 rounded-2xl border border-dashed border-emerald-500/30 bg-slate-950/40 text-center space-y-3">
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

    // Signature checking to prevent unnecessary DOM thrashing on ticks
    const renderSignature = JSON.stringify({
        outlets: (outlets || []).map(s => ({
            id: s.id,
            state: s.state,
            powerWatts: s.powerWatts,
            currentAmps: s.currentAmps,
            dailyKwh: s.dailyKwh,
            timerMinutesRemaining: s.timerMinutesRemaining
        })),
        role: window.smartUpsAuth?.currentUser?.role
    });

    if (container.dataset.lastSignature === renderSignature) {
        return; // UI state is identical, skip DOM rebuild
    }
    container.dataset.lastSignature = renderSignature;

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
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                            sock.state ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500'
                        }">
                            🔌
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-white text-sm">${sock.name}</h4>
                                ${sock.isNewlyPaired ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400 text-black animate-pulse leading-none tracking-wider">NEW</span>` : ''}
                            </div>
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
    }).join('') + `
        <div class="btn-pair-more-outlet p-5 rounded-2xl border border-dashed border-emerald-500/30 hover:border-emerald-400/80 bg-slate-950/40 hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[170px] group shadow-sm">
            <div class="w-11 h-11 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 group-hover:border-emerald-400 group-hover:bg-emerald-500/20 flex items-center justify-center text-xl text-emerald-400 transition-all mb-2 group-hover:scale-105">＋</div>
            <h4 class="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Add More Outlets</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">Pair another smart socket or plug</p>
            <button type="button" class="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 group-hover:bg-emerald-500 group-hover:text-black transition-all cursor-pointer">＋ Add More</button>
        </div>
    `;

    // Attach Add More Outlet listener
    container.querySelectorAll('.btn-pair-more-outlet').forEach(btn => {
        btn.addEventListener('click', () => {
            window.smartUpsPairing.openForType('outlet');
        });
    });

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
            btnSound.innerHTML = enabled ? '<span>🔊</span><span>Audio ON</span>' : '<span>🔇</span><span>Audio Muted</span>';
            window.showToast(enabled ? "Relay & alarm audio enabled." : "Audio muted.", "info");
        });
    }
}

// -------------------------------------------------------------
// Quick Actions (All On / All Off & Add Devices)
// -------------------------------------------------------------
function setupQuickActions() {
    const btnHeaderAddSwitch = document.getElementById('btnHeaderAddSwitch');
    if (btnHeaderAddSwitch) {
        btnHeaderAddSwitch.addEventListener('click', () => {
            window.smartUpsPairing.openForType('switch');
        });
    }

    const btnHeaderAddOutlet = document.getElementById('btnHeaderAddOutlet');
    if (btnHeaderAddOutlet) {
        btnHeaderAddOutlet.addEventListener('click', () => {
            window.smartUpsPairing.openForType('outlet');
        });
    }

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
            openProfileModal();
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

// -------------------------------------------------------------
// 30% Battery Critical Alert & Device Shedding Modal Controller
// -------------------------------------------------------------
function setupBatteryAlertHandlers() {
    // Request web notification permission on first user click anywhere
    const requestNotifOnce = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                Notification.requestPermission();
            } catch (e) {
                console.warn("Could not request notification permission", e);
            }
        }
        document.removeEventListener('click', requestNotifOnce);
    };
    document.addEventListener('click', requestNotifOnce, { once: true });

    // Listen for custom 30% battery event from engine
    window.addEventListener('smartups:battery-30-alert', (e) => {
        const battLevel = (e.detail && e.detail.batteryLevel !== undefined) ? e.detail.batteryLevel : 30;
        openBatteryAlertModal(battLevel);
    });

    // 30% Critical Battery Alarm is always ON by default

    // Check / Test alert buttons in header (desktop and mobile)
    const btnTest30 = document.getElementById('btnTest30Alert');
    if (btnTest30) {
        btnTest30.addEventListener('click', () => {
            if (window.smartUpsEngine) {
                window.smartUpsEngine.trigger30PercentAlert(true);
            } else {
                openBatteryAlertModal(30);
            }
        });
    }

    const btnTest30Mob = document.getElementById('btnTest30AlertMobile');
    if (btnTest30Mob) {
        btnTest30Mob.addEventListener('click', () => {
            if (window.smartUpsEngine) {
                window.smartUpsEngine.trigger30PercentAlert(true);
            } else {
                openBatteryAlertModal(30);
            }
        });
    }

    // Modal dismiss buttons
    const btnCloseAlert = document.getElementById('btnCloseBatteryAlert');
    const btnCancelAlert = document.getElementById('btnCancelBatteryAlert');
    if (btnCloseAlert) btnCloseAlert.addEventListener('click', closeBatteryAlertModal);
    if (btnCancelAlert) btnCancelAlert.addEventListener('click', closeBatteryAlertModal);
}

function openBatteryAlertModal(battLevel = 30) {
    // 1. Dispatch Web Notification
    if ('Notification' in window) {
        const fireNotification = () => {
            try {
                new Notification('⚠️ 30% Battery Reserve Alert - SmartUps', {
                    body: `Battery reserve dropped to ${battLevel}%. Select 2 active devices to power down immediately to preserve runtime.`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
                    tag: 'smartups-battery-30-alert',
                    renotify: true
                });
            } catch (err) {
                console.warn("Web Notification dispatch error:", err);
            }
        };

        if (Notification.permission === 'granted') {
            fireNotification();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    fireNotification();
                }
            });
        }
    }

    // 2. Play Audible Warning Alarm
    if (window.smartUpsEngine) {
        window.smartUpsEngine.playBeep(880, 0.2, 3);
    }

    // 3. Populate Modal Elements
    const modal = document.getElementById('batteryAlertModal');
    const battLevelText = document.getElementById('alertModalBattLevel');
    const selectedCountEl = document.getElementById('alertSelectedCount');
    const targetCountEl = document.getElementById('alertTargetCount');
    const listEl = document.getElementById('batteryAlertDevicesList');
    const emptyNoticeEl = document.getElementById('batteryAlertEmptyNotice');
    const confirmBtn = document.getElementById('btnConfirmBatteryShed');
    const confirmBtnText = document.getElementById('btnConfirmBatteryShedText');

    if (battLevelText) battLevelText.textContent = `${battLevel}%`;

    // Retrieve live active devices
    const engineData = window.smartUpsEngine ? window.smartUpsEngine.data : { switches: [], outlets: [] };
    const activeSwitches = (engineData.switches || []).filter(s => s.state);
    const activeOutlets = (engineData.outlets || []).filter(s => s.state);

    const activeDevices = [
        ...activeSwitches.map(sw => ({
            id: sw.id,
            type: 'switch',
            name: sw.name,
            room: sw.room,
            watts: sw.currentLoadWatts || 0,
            icon: '⚡'
        })),
        ...activeOutlets.map(sock => ({
            id: sock.id,
            type: 'outlet',
            name: sock.name,
            room: sock.room,
            watts: sock.powerWatts || 0,
            icon: '🔌'
        }))
    ];

    const targetCount = Math.min(2, activeDevices.length);
    const selectedIds = new Set();

    if (activeDevices.length === 0) {
        if (emptyNoticeEl) emptyNoticeEl.classList.remove('hidden');
        if (listEl) listEl.classList.add('hidden');
        if (selectedCountEl) selectedCountEl.textContent = "0";
        if (targetCountEl) targetCountEl.textContent = "0";

        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.className = "px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2";
            if (confirmBtnText) confirmBtnText.textContent = "Acknowledge & Close";
            confirmBtn.onclick = () => closeBatteryAlertModal();
        }
    } else {
        if (emptyNoticeEl) emptyNoticeEl.classList.add('hidden');
        if (listEl) {
            listEl.classList.remove('hidden');
            listEl.innerHTML = '';
        }

        const updateSelectionUI = () => {
            if (selectedCountEl) selectedCountEl.textContent = selectedIds.size;
            if (targetCountEl) targetCountEl.textContent = targetCount;

            // Update card styles
            if (listEl) {
                listEl.querySelectorAll('[data-id]').forEach(card => {
                    const id = card.dataset.id;
                    const isSelected = selectedIds.has(id);
                    const checkBox = card.querySelector('.check-box');
                    const statusText = card.querySelector('.shed-status');

                    if (isSelected) {
                        card.className = "p-3 rounded-xl border border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/40 transition-all cursor-pointer flex items-center justify-between gap-3";
                        if (checkBox) {
                            checkBox.className = "check-box w-5 h-5 rounded-md bg-cyan-400 border border-cyan-300 text-black flex items-center justify-center text-xs font-bold transition-all";
                            checkBox.textContent = "✓";
                        }
                        if (statusText) {
                            statusText.className = "shed-status text-[10px] text-cyan-400 font-mono font-bold";
                            statusText.textContent = "Keep Online ⚡";
                        }
                    } else {
                        const allSelected = selectedIds.size === targetCount;
                        card.className = allSelected 
                            ? "p-3 rounded-xl border border-rose-950/80 bg-rose-950/10 hover:border-rose-800/60 transition-all cursor-pointer flex items-center justify-between gap-3 text-slate-400"
                            : "p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 text-slate-300";
                        if (checkBox) {
                            checkBox.className = "check-box w-5 h-5 rounded-md border border-slate-700 flex items-center justify-center text-xs font-bold transition-all";
                            checkBox.textContent = "";
                        }
                        if (statusText) {
                            statusText.className = allSelected 
                                ? "shed-status text-[10px] text-rose-400 font-mono font-semibold"
                                : "shed-status text-[10px] text-slate-500 font-mono";
                            statusText.textContent = allSelected ? "Will Cut 🔌" : "Tap to Keep";
                        }
                    }
                });
            }

            // Update Confirm Button
            if (confirmBtn && confirmBtnText) {
                if (selectedIds.size === targetCount) {
                    confirmBtn.disabled = false;
                    confirmBtn.className = "px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all cursor-pointer flex items-center gap-2";
                    confirmBtnText.textContent = `Keep ${targetCount} Selected Devices & Save Reserve (${selectedIds.size}/${targetCount})`;
                } else {
                    confirmBtn.disabled = true;
                    confirmBtn.className = "px-4 py-2.5 rounded-xl bg-slate-800 text-slate-600 border border-slate-700 text-xs font-bold transition-all cursor-not-allowed flex items-center gap-2 shadow-md";
                    const remaining = targetCount - selectedIds.size;
                    confirmBtnText.textContent = `Select ${remaining} more device${remaining > 1 ? 's' : ''} to keep (${selectedIds.size}/${targetCount})`;
                }
            }
        };

        // Render card for each active device
        activeDevices.forEach(item => {
            const card = document.createElement('div');
            card.className = "p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 text-slate-300";
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="check-box w-5 h-5 rounded-md border border-slate-700 flex items-center justify-center text-xs font-bold transition-all"></span>
                    <div class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-sm">${item.icon}</div>
                    <div>
                        <div class="text-xs font-bold text-white">${item.name}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${item.room} • <span class="capitalize">${item.type}</span></div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-bold font-mono text-cyan-400">${item.watts} W</div>
                    <div class="shed-status text-[10px] text-slate-500 font-mono">Tap to Keep</div>
                </div>
            `;

            card.addEventListener('click', () => {
                if (selectedIds.has(item.id)) {
                    selectedIds.delete(item.id);
                } else {
                    if (selectedIds.size < targetCount) {
                        selectedIds.add(item.id);
                    } else {
                        window.showToast(`You must select ${targetCount} devices to keep online. Uncheck one first.`, "info");
                        return;
                    }
                }
                updateSelectionUI();
            });

            if (listEl) listEl.appendChild(card);
        });

        updateSelectionUI();

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (selectedIds.size < targetCount) return;

                const keepDevices = activeDevices.filter(d => selectedIds.has(d.id));
                const cutDevices = activeDevices.filter(d => !selectedIds.has(d.id));

                const keepNames = keepDevices.map(d => d.name);
                const cutNames = cutDevices.map(d => d.name);

                // Disconnect unselected active circuits to preserve battery reserve
                cutDevices.forEach(dev => {
                    if (dev.type === 'switch') {
                        window.smartUpsEngine.toggleSwitch(dev.id);
                    } else if (dev.type === 'outlet') {
                        window.smartUpsEngine.toggleOutlet(dev.id);
                    }
                });

                if (window.smartUpsEngine) {
                    window.smartUpsEngine.playRelaySound(false);
                    if (cutNames.length > 0) {
                        window.smartUpsEngine.logEvent('warning', `30% Battery Reserve: Kept ${keepNames.join(', ')} online. Disconnected ${cutNames.join(', ')} to preserve battery reserve.`);
                    } else {
                        window.smartUpsEngine.logEvent('info', `30% Battery Reserve: Keeping ${keepNames.join(', ')} online.`);
                    }
                }

                if (cutNames.length > 0) {
                    window.showToast(`30% Battery Reserve: Kept ${keepNames.join(', ')} online (cut ${cutNames.length} circuits)!`, "warning");
                } else {
                    window.showToast(`30% Battery Reserve: Kept ${keepNames.join(', ')} online!`, "success");
                }
                closeBatteryAlertModal();
            };
        }
    }

    // Display modal in the middle of the screen
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeBatteryAlertModal() {
    const modal = document.getElementById('batteryAlertModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
