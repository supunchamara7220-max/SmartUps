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
            // Merge in default DEMO_USERS so all predefined role logins always exist
            const merged = [...DEMO_USERS];
            stored.forEach(u => {
                if (!merged.some(m => m.email.toLowerCase() === u.email.toLowerCase())) {
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
        const normalizedPassword = (password || '').trim();
        const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === normalizedPassword);

        if (!user) {
            return { success: false, message: "Invalid email or password. Please verify your credentials or click 'Create New Account'." };
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
