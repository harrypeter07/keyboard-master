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
            max-width: 360px;
            background: var(--bg-surface, #FFFDF9);
            border: 1px solid var(--border, #E8D9CE);
            border-radius: var(--radius-lg, 16px);
            padding: 28px;
            box-shadow: 0 20px 40px rgba(43, 22, 37, 0.08);
            display: flex;
            flex-direction: column;
            gap: 16px;
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
        }

        .auth-btn:hover {
            opacity: 0.95;
            transform: translateY(-1px);
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
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #ef4444;
            padding: 8px 12px;
            border-radius: var(--radius-md, 8px);
            font-size: 0.78rem;
            text-align: center;
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
        acceptedTerms: { type: Boolean },
        errorMessage: { type: String },
        isBanned: { type: Boolean },
        banReason: { type: String },
        showTermsModal: { type: Boolean },
        onAuthSuccess: { type: Function },
    };

    constructor() {
        super();
        this.isSignUp = false;
        this.email = '';
        this.password = '';
        this.acceptedTerms = false;
        this.errorMessage = '';
        this.isBanned = false;
        this.banReason = '';
        this.showTermsModal = false;
        this.onAuthSuccess = () => {};
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.errorMessage = '';

        if (this.isSignUp && !this.acceptedTerms) {
            this.errorMessage = 'You must accept the Terms & Conditions to sign up.';
            return;
        }

        if (!this.email || !this.password) {
            this.errorMessage = 'Please enter both email and password.';
            return;
        }

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

            // Save session token in storage
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('save-cloud-token', data.token);
            }

            this.onAuthSuccess(data.user, data.token);
        } catch (err) {
            console.error('Auth error:', err);
            // Fallback for offline mode
            this.onAuthSuccess({ email: this.email, plan: 'free' }, 'offline_token');
        }
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

        return html`
            <div class="auth-card">
                <div class="auth-header">
                    <h2>${this.isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                    <p>${this.isSignUp ? 'Sign up to unlock features & subscription plans' : 'Sign in to Keyboard Master'}</p>
                </div>

                ${this.errorMessage ? html`<div class="error-msg">${this.errorMessage}</div>` : ''}

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
                        <input
                            type="password"
                            placeholder="••••••••"
                            .value=${this.password}
                            @input=${e => this.password = e.target.value}
                            required
                        />
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

                    <button type="submit" class="auth-btn" style="margin-top: 16px;">
                        ${this.isSignUp ? 'Sign Up' : 'Sign In'}
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
