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
            return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || DEMO_USERS;
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
        const normalizedEmail = email.trim().toLowerCase();
        const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);

        if (!user) {
            return { success: false, message: "Invalid email or password. Please check credentials or use Quick Demo accounts." };
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

    register(name, email, password, role = "operator") {
        const users = this.getAllUsers();
        const normalizedEmail = email.trim().toLowerCase();

        if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
            return { success: false, message: "An account with this email address already exists." };
        }

        if (password.length < 4) {
            return { success: false, message: "Password must be at least 4 characters long." };
        }

        const newUser = {
            id: "usr_" + Date.now().toString(36),
            name: name.trim(),
            email: normalizedEmail,
            password: password,
            role: role,
            avatar: role === "admin" ? "⚡" : (role === "operator" ? "🛡️" : "👤"),
            title: role === "admin" ? "System Administrator" : (role === "operator" ? "Power Controller" : "Guest Operator"),
            canPair: role === "admin",
            canConfigure: role === "admin",
            canToggle: role !== "viewer"
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
        return this.currentUser && this.currentUser.role === 'admin';
    }

    canToggle() {
        return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'operator');
    }

    canPair() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    emitAuthChange() {
        window.dispatchEvent(new CustomEvent('smartups:auth-changed', {
            detail: { user: this.currentUser }
        }));
    }
}

// Global singleton instance
window.smartUpsAuth = new AuthManager();
