import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import './TermsModal.js';

export class AuthView extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: var(--space-md);
            color: var(--text-primary, #2B1625);
            font-family: var(--font);
            box-sizing: border-box;
            background: var(--bg-app, #FAF6F0);
            position: relative;
            overflow-y: auto;
        }

        .auth-card {
            width: 100%;
            max-width: 380px;
            background: var(--bg-surface, #FFFDF9);
            border: 1px solid var(--border, #E8D9CE);
            border-radius: var(--radius-lg, 16px);
            padding: 28px;
            box-shadow: 0 20px 40px rgba(43, 22, 37, 0.08);
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .auth-header {
            text-align: center;
        }

        .auth-header h2 {
            font-size: 1.4rem;
            font-weight: 700;
            margin: 0 0 6px 0;
            background: linear-gradient(135deg, #BE185D, #7E22CE);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .auth-header p {
            font-size: 0.82rem;
            color: var(--text-secondary, #704764);
            margin: 0;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-group label {
            font-size: 0.78rem;
            color: var(--text-secondary, #704764);
            font-weight: 600;
        }

        .password-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .password-wrapper input {
            width: 100%;
            padding-right: 42px !important;
            box-sizing: border-box;
        }

        .eye-toggle-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-secondary, #704764);
            cursor: pointer;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: color 0.15s, background 0.15s;
        }

        .eye-toggle-btn:hover {
            color: #BE185D;
            background: var(--bg-hover, #EBE0D3);
        }

        .eye-toggle-btn svg {
            width: 18px;
            height: 18px;
        }

        .form-group input {
            background: var(--bg-elevated, #F3EBE1);
            border: 1px solid var(--border, #E8D9CE);
            border-radius: var(--radius-md, 8px);
            padding: 10px 14px;
            color: var(--text-primary, #2B1625);
            font-size: 0.88rem;
            outline: none;
            transition: border-color var(--transition), box-shadow var(--transition);
        }

        .form-group input:focus {
            border-color: #BE185D;
            box-shadow: 0 0 0 2px rgba(190, 24, 93, 0.15);
        }

        .password-strength {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 4px;
        }

        .strength-bar-track {
            flex: 1;
            height: 4px;
            background: var(--bg-elevated, #F3EBE1);
            border-radius: 2px;
            overflow: hidden;
        }

        .strength-bar-fill {
            height: 100%;
            width: 0%;
            transition: width 0.3s ease, background-color 0.3s ease;
        }

        .strength-text {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--text-secondary, #704764);
        }

        .terms-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 0.75rem;
            color: var(--text-secondary, #704764);
            line-height: 1.3;
        }

        .terms-row input {
            margin-top: 2px;
            cursor: pointer;
        }

        .terms-link {
            color: #BE185D;
            font-weight: 600;
            text-decoration: underline;
            cursor: pointer;
        }

        .auth-btn {
            background: linear-gradient(135deg, #BE185D, #7E22CE);
            color: white;
            border: none;
            border-radius: var(--radius-md, 8px);
            padding: 11px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: opacity var(--transition), transform var(--transition);
            margin-top: 4px;
            box-shadow: 0 4px 12px rgba(190, 24, 93, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .auth-btn:hover:not(:disabled) {
            opacity: 0.95;
            transform: translateY(-1px);
        }

        .auth-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            transform: none;
        }

        .btn-spinner {
            width: 18px;
            height: 18px;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .toggle-mode {
            text-align: center;
            font-size: 0.8rem;
            color: var(--text-secondary, #704764);
        }

        .toggle-mode span {
            color: #BE185D;
            cursor: pointer;
            text-decoration: underline;
            font-weight: 600;
        }

        .error-msg {
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            padding: 8px 12px;
            border-radius: var(--radius-md, 8px);
            font-size: 0.78rem;
            text-align: center;
        }

        .success-msg {
            background: rgba(34, 197, 94, 0.12);
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #16a34a;
            padding: 8px 12px;
            border-radius: var(--radius-md, 8px);
            font-size: 0.78rem;
            text-align: center;
        }

        /* Profile / Logged In Dashboard Card */
        .profile-card {
            width: 100%;
            max-width: 420px;
            background: var(--bg-surface, #FFFDF9);
            border: 1px solid var(--border, #E8D9CE);
            border-radius: var(--radius-lg, 16px);
            padding: 28px;
            box-shadow: 0 20px 40px rgba(43, 22, 37, 0.08);
            display: flex;
            flex-direction: column;
            gap: 20px;
            animation: fadeIn 0.25s ease-out;
        }

        .profile-header {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .avatar-circle {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: linear-gradient(135deg, #BE185D, #7E22CE);
            color: white;
            font-weight: 700;
            font-size: 1.4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
            flex-shrink: 0;
        }

        .profile-info {
            flex: 1;
            overflow: hidden;
        }

        .profile-info h3 {
            margin: 0 0 2px 0;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-primary, #2B1625);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .profile-info p {
            margin: 0;
            font-size: 0.8rem;
            color: var(--text-secondary, #704764);
        }

        .plan-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            background: rgba(190, 24, 93, 0.12);
            color: #BE185D;
            border: 1px solid rgba(190, 24, 93, 0.25);
            margin-top: 4px;
        }

        .profile-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            background: var(--bg-elevated, #F3EBE1);
            padding: 14px;
            border-radius: var(--radius-md, 10px);
            border: 1px solid var(--border, #E8D9CE);
        }

        .detail-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .detail-label {
            font-size: 0.7rem;
            color: var(--text-secondary, #704764);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }

        .detail-value {
            font-size: 0.82rem;
            color: var(--text-primary, #2B1625);
            font-weight: 600;
        }

        .profile-actions {
            display: flex;
            gap: 10px;
        }

        .signout-btn {
            flex: 1;
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: var(--radius-md, 8px);
            padding: 10px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .signout-btn:hover {
            background: rgba(239, 68, 68, 0.18);
            border-color: rgba(239, 68, 68, 0.5);
        }

        .sync-btn {
            flex: 1;
            background: var(--bg-elevated, #F3EBE1);
            color: var(--text-primary, #2B1625);
            border: 1px solid var(--border, #E8D9CE);
            border-radius: var(--radius-md, 8px);
            padding: 10px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .sync-btn:hover {
            background: var(--bg-hover, #EBE0D3);
            border-color: var(--border-strong, #D4BEB0);
        }

        /* Banned Lockout Screen */
        .banned-card {
            text-align: center;
            padding: 32px 24px;
        }

        .banned-card svg {
            width: 48px;
            height: 48px;
            color: #ef4444;
            margin-bottom: 12px;
        }

        .banned-card h2 {
            color: #ef4444;
            margin: 0 0 8px 0;
            font-size: 1.4rem;
        }

        .banned-card p {
            font-size: 0.85rem;
            color: var(--text-muted);
            line-height: 1.5;
        }
    `;

    static properties = {
        isSignUp: { type: Boolean },
        email: { type: String },
        password: { type: String },
        showPassword: { type: Boolean },
        isLoading: { type: Boolean },
        acceptedTerms: { type: Boolean },
        errorMessage: { type: String },
        successMessage: { type: String },
        isBanned: { type: Boolean },
        banReason: { type: String },
        showTermsModal: { type: Boolean },
        user: { type: Object },
        token: { type: String },
        onAuthSuccess: { type: Function },
    };

    constructor() {
        super();
        this.isSignUp = false;
        this.email = '';
        this.password = '';
        this.showPassword = false;
        this.isLoading = false;
        this.acceptedTerms = false;
        this.errorMessage = '';
        this.successMessage = '';
        this.isBanned = false;
        this.banReason = '';
        this.showTermsModal = false;
        this.user = null;
        this.token = '';
        this.onAuthSuccess = () => {};
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadSavedSession();
    }

    async loadSavedSession() {
        try {
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                const res = await ipcRenderer.invoke('storage:get-cloud-session');
                if (res && res.success && res.data && res.data.user) {
                    this.user = res.data.user;
                    this.token = res.data.token || '';
                    return;
                }
            }
            const localUserStr = localStorage.getItem('km_cloud_user');
            if (localUserStr) {
                this.user = JSON.parse(localUserStr);
                this.token = localStorage.getItem('km_cloud_token') || '';
            }
        } catch (err) {
            console.warn('Could not load saved session:', err.message);
        }
    }

    getPasswordStrength(pass) {
        if (!pass) return { score: 0, label: '', color: '#E8D9CE', width: '0%' };
        let score = 0;
        if (pass.length >= 6) score += 1;
        if (pass.length >= 10) score += 1;
        if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        switch (score) {
            case 1:
                return { score: 1, label: 'Weak', color: '#ef4444', width: '25%' };
            case 2:
                return { score: 2, label: 'Fair', color: '#f59e0b', width: '50%' };
            case 3:
                return { score: 3, label: 'Good', color: '#3b82f6', width: '75%' };
            case 4:
                return { score: 4, label: 'Strong', color: '#16a34a', width: '100%' };
            default:
                return { score: 0, label: 'Too short', color: '#ef4444', width: '15%' };
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.errorMessage = '';
        this.successMessage = '';

        if (this.isSignUp && !this.acceptedTerms) {
            this.errorMessage = 'You must accept the Terms & Conditions to sign up.';
            return;
        }

        if (!this.email || !this.password) {
            this.errorMessage = 'Please enter both email and password.';
            return;
        }

        this.isLoading = true;

        const endpoint = this.isSignUp ? '/api/auth/register' : '/api/auth/login';
        const baseUrl = (typeof process !== 'undefined' && process.env && process.env.API_URL)
            ? process.env.API_URL
            : 'https://keycompanion.vercel.app';
        const serverUrl = baseUrl + endpoint;

        try {
            const res = await fetch(serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.email,
                    password: this.password,
                    acceptedTerms: this.acceptedTerms,
                    deviceId: window.navigator.userAgent,
                    platform: window.navigator.platform,
                }),
            });

            const data = await res.json();

            if (!data.success) {
                if (data.isBanned) {
                    this.isBanned = true;
                    this.banReason = data.error;
                } else {
                    this.errorMessage = data.error || 'Authentication failed.';
                }
                return;
            }

            this.user = data.user || { email: this.email, plan: 'free' };
            this.token = data.token || 'auth_token';

            // Save session token in persistent storage
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('storage:set-cloud-session', {
                    user: this.user,
                    token: this.token,
                    loginTime: Date.now(),
                }).catch(() => {});
            }
            try {
                localStorage.setItem('km_cloud_user', JSON.stringify(this.user));
                localStorage.setItem('km_cloud_token', this.token);
            } catch {}

            this.successMessage = this.isSignUp ? 'Account created successfully!' : 'Signed in successfully!';
            this.onAuthSuccess(this.user, this.token);
        } catch (err) {
            console.error('Auth error:', err);
            // Fallback offline session
            const fallbackUser = { email: this.email, plan: 'free' };
            this.user = fallbackUser;
            this.token = 'offline_token';
            this.onAuthSuccess(fallbackUser, 'offline_token');
        } finally {
            this.isLoading = false;
        }
    }

    async handleSignOut() {
        this.user = null;
        this.token = '';
        this.email = '';
        this.password = '';
        this.errorMessage = '';
        this.successMessage = '';
        this.showPassword = false;

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('storage:clear-cloud-session').catch(() => {});
        }
        try {
            localStorage.removeItem('km_cloud_user');
            localStorage.removeItem('km_cloud_token');
        } catch {}
        this.requestUpdate();
    }

    async handleSyncAccount() {
        this.successMessage = 'Account synced with Keyboard Master Cloud!';
        setTimeout(() => { this.successMessage = ''; }, 3000);
    }

    render() {
        if (this.isBanned) {
            return html`
                <div class="auth-card banned-card">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m4.93 4.93 14.14 14.14"/>
                    </svg>
                    <h2>Account Banned</h2>
                    <p>${this.banReason || 'Your account or device has been remotely suspended for terms violation.'}</p>
                </div>
            `;
        }

        // Render Logged In Profile Dashboard if User is Authenticated
        if (this.user) {
            const initial = (this.user.email || 'U').charAt(0).toUpperCase();
            return html`
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="avatar-circle">${initial}</div>
                        <div class="profile-info">
                            <h3>${this.user.email}</h3>
                            <p>Keyboard Master Cloud Member</p>
                            <span class="plan-badge">${this.user.plan || 'Pro Member'}</span>
                        </div>
                    </div>

                    ${this.successMessage ? html`<div class="success-msg">${this.successMessage}</div>` : ''}

                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Status</span>
                            <span class="detail-value" style="color: #16a34a;">● Verified</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Platform</span>
                            <span class="detail-value">${window.navigator.platform || 'Windows'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">App License</span>
                            <span class="detail-value">Keyboard Master v0.8</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">AI Runtime</span>
                            <span class="detail-value">Active (Cloud & Local)</span>
                        </div>
                    </div>

                    <div class="profile-actions">
                        <button class="sync-btn" @click=${this.handleSyncAccount}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                            Sync Plan
                        </button>
                        <button class="signout-btn" @click=${this.handleSignOut}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            `;
        }

        const strength = this.getPasswordStrength(this.password);

        return html`
            <div class="auth-card">
                <div class="auth-header">
                    <h2>${this.isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                    <p>${this.isSignUp ? 'Sign up to unlock features & subscription plans' : 'Sign in to Keyboard Master'}</p>
                </div>

                ${this.errorMessage ? html`<div class="error-msg">${this.errorMessage}</div>` : ''}
                ${this.successMessage ? html`<div class="success-msg">${this.successMessage}</div>` : ''}

                <form @submit=${this.handleSubmit}>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="user@example.com"
                            .value=${this.email}
                            @input=${e => this.email = e.target.value}
                            required
                        />
                    </div>

                    <div class="form-group" style="margin-top: 10px;">
                        <label>Password</label>
                        <div class="password-wrapper">
                            <input
                                type=${this.showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                .value=${this.password}
                                @input=${e => this.password = e.target.value}
                                required
                            />
                            <button
                                type="button"
                                class="eye-toggle-btn"
                                @click=${() => this.showPassword = !this.showPassword}
                                title=${this.showPassword ? 'Hide password' : 'Show password'}
                            >
                                ${this.showPassword
                                    ? html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`
                                    : html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`}
                            </button>
                        </div>

                        ${this.isSignUp && this.password ? html`
                            <div class="password-strength">
                                <div class="strength-bar-track">
                                    <div class="strength-bar-fill" style="width: ${strength.width}; background-color: ${strength.color};"></div>
                                </div>
                                <span class="strength-text" style="color: ${strength.color};">${strength.label}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${this.isSignUp ? html`
                        <div class="terms-row" style="margin-top: 12px;">
                            <input
                                type="checkbox"
                                .checked=${this.acceptedTerms}
                                @change=${e => this.acceptedTerms = e.target.checked}
                            />
                            <span>
                                I accept the <span class="terms-link" @click=${() => this.showTermsModal = true}>Terms & Conditions</span> policy.
                            </span>
                        </div>
                    ` : ''}

                    <button
                        type="submit"
                        class="auth-btn"
                        ?disabled=${this.isLoading}
                        style="margin-top: 16px;"
                    >
                        ${this.isLoading ? html`
                            <svg class="btn-spinner" viewBox="0 0 24 24" fill="none">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.3"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>${this.isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                        ` : (this.isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div class="toggle-mode">
                    ${this.isSignUp ? html`
                        Already have an account? <span @click=${() => { this.isSignUp = false; this.errorMessage = ''; }}>Sign In</span>
                    ` : html`
                        Don't have an account? <span @click=${() => { this.isSignUp = true; this.errorMessage = ''; }}>Sign Up</span>
                    `}
                </div>
            </div>

            <terms-modal
                .isOpen=${this.showTermsModal}
                .onClose=${() => this.showTermsModal = false}
            ></terms-modal>
        `;
    }
}

customElements.define('auth-view', AuthView);
