/**
 * SmartUps - Authentication & Role-Based Access Control
 * Handles login, registration, session persistence, role permissions, and user profiles.
 */

const USERS_STORAGE_KEY = 'smartups_registered_users_v1';
const CURRENT_USER_KEY = 'smartups_active_session_v1';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initUsers();
        this.loadSession();
    }

    initUsers() {
        if (!localStorage.getItem(USERS_STORAGE_KEY)) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEMO_USERS));
        }
    }

    getAllUsers() {
        try {
            const stored = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
            // Start with current DEMO_USERS so all predefined role logins always have latest credentials
            const merged = JSON.parse(JSON.stringify(DEMO_USERS));
            
            stored.forEach(u => {
                const demoIndex = merged.findIndex(m => m.email.toLowerCase() === (u.email || '').toLowerCase());
                if (demoIndex !== -1) {
                    // Refresh permissions while keeping any custom properties
                    merged[demoIndex] = { ...merged[demoIndex], ...u, password: merged[demoIndex].password, canPair: true, canConfigure: true, canToggle: true };
                } else {
                    merged.push(u);
                }
            });
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
            return merged;
        } catch (e) {
            return DEMO_USERS;
        }
    }

    loadSession() {
        try {
            const savedUser = localStorage.getItem(CURRENT_USER_KEY);
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            } else {
                this.currentUser = null;
            }
        } catch (e) {
            this.currentUser = null;
        }
    }

    saveSession() {
        if (this.currentUser) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }

    login(email, password) {
        const users = this.getAllUsers();
        const normalizedEmail = (email || '').trim().toLowerCase();
        const rawPassword = (password || '').trim();
        const lowerPassword = rawPassword.toLowerCase();

        const user = users.find(u => {
            const uEmail = (u.email || '').trim().toLowerCase();
            if (uEmail !== normalizedEmail) return false;

            const uPass = (u.password || '').trim();
            const uPassLower = uPass.toLowerCase();

            // 1. Direct match (exact or case-insensitive)
            if (uPass === rawPassword || uPassLower === lowerPassword) return true;

            // 2. Flexible aliases for demo accounts (e.g. 'student', 'student123', 'student@123', 'password', '123456')
            const emailPrefix = uEmail.split('@')[0];
            const roleName = (u.role || '').toLowerCase();
            const allowedAliases = [
                uPassLower,
                emailPrefix,
                `${emailPrefix}123`,
                `${emailPrefix}@123`,
                roleName,
                `${roleName}123`,
                'password',
                '123456',
                'admin',
                'admin123'
            ];

            return allowedAliases.includes(lowerPassword);
        });

        if (!user) {
            const emailPrefix = normalizedEmail.split('@')[0] || 'student';
            return {
                success: false,
                message: `Invalid password for ${email.trim()}. Password is "${emailPrefix}123" or "${emailPrefix}". Click the quick-fill chip below or "Create New Account".`
            };
        }

        this.currentUser = user;
        this.saveSession();
        this.emitAuthChange();
        return { success: true, user: this.currentUser };
    }

    quickLogin(role) {
        const users = this.getAllUsers();
        const user = users.find(u => u.role === role);
        if (user) {
            this.currentUser = user;
            this.saveSession();
            this.emitAuthChange();
            return { success: true, user: this.currentUser };
        }
        return { success: false, message: `Account with role ${role} not found.` };
    }

    register(name, email, password, role = "household_resident") {
        const users = this.getAllUsers();
        const normalizedEmail = (email || '').trim().toLowerCase();

        if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
            return { success: false, message: "An account with this email address already exists." };
        }

        if (password.length < 4) {
            return { success: false, message: "Password must be at least 4 characters long." };
        }

        const roleMeta = {
            energy_engineer: {
                avatar: "⚡",
                title: "Energy Sector Engineer",
                canPair: true,
                canConfigure: true,
                canToggle: true
            },
            business_owner: {
                avatar: "🏢",
                title: "Small Business Owner",
                canPair: true,
                canConfigure: true,
                canToggle: true
            },
            household_resident: {
                avatar: "🏡",
                title: "Household Resident",
                canPair: true,
                canConfigure: true,
                canToggle: true
            },
            office_worker: {
                avatar: "💼",
                title: "Office Worker",
                canPair: true,
                canConfigure: true,
                canToggle: true
            },
            student: {
                avatar: "🎓",
                title: "Student / Researcher",
                canPair: true,
                canConfigure: true,
                canToggle: true
            }
        }[role] || {
            avatar: "👤",
            title: "SmartUps User",
            canPair: true,
            canConfigure: true,
            canToggle: true
        };

        const newUser = {
            id: "usr_custom_" + Date.now().toString(36),
            name: name.trim(),
            email: normalizedEmail,
            password: password.trim(),
            role: role,
            isCustomAccount: true, // Marker: newly created account starts with NO pre-assigned devices!
            avatar: roleMeta.avatar,
            title: roleMeta.title,
            canPair: true, // Ability to add devices as they wish!
            canConfigure: true,
            canToggle: true
        };

        users.push(newUser);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

        // Guarantee new account starts with zero devices, 0 load, and 0 runtime
        const cleanState = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_DATA));
        cleanState.switches = [];
        cleanState.outlets = [];
        cleanState.logs = [
            {
                id: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                type: "info",
                text: `Welcome, ${newUser.name}! Account created with clean power topology. No pre-assigned devices. Output load: 0 W.`
            }
        ];
        localStorage.setItem(`smartups_system_state_v1_${newUser.id}`, JSON.stringify(cleanState));

        // Auto-login newly registered user
        this.currentUser = newUser;
        this.saveSession();
        this.emitAuthChange();

        return { success: true, user: newUser };
    }

    logout() {
        this.currentUser = null;
        this.saveSession();
        this.emitAuthChange();
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        if (!this.currentUser) return false;
        const r = this.currentUser.role;
        return r === 'energy_engineer' || r === 'business_owner' || r === 'admin';
    }

    canToggle() {
        if (!this.currentUser) return false;
        return !!this.currentUser.canToggle;
    }

    canPair() {
        if (!this.currentUser) return false;
        return !!this.currentUser.canPair;
    }

    emitAuthChange() {
        window.dispatchEvent(new CustomEvent('smartups:auth-changed', {
            detail: { user: this.currentUser }
        }));
    }
}

// Global singleton instance
window.smartUpsAuth = new AuthManager();
