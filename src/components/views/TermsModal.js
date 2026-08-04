import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class TermsModal extends LitElement {
    static styles = css`
        :host {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .modal-card {
            background: var(--bg-surface, #111827);
            border: 1px solid var(--border, rgba(255,255,255,0.1));
            border-radius: var(--radius-lg, 16px);
            width: 100%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            overflow: hidden;
            color: var(--text-primary, #f9fafb);
            font-family: var(--font, sans-serif);
        }

        .modal-header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--border, rgba(255,255,255,0.1));
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-elevated, #1f2937);
        }

        .modal-header h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .close-btn {
            background: none;
            border: none;
            color: var(--text-muted, #9ca3af);
            font-size: 1.5rem;
            cursor: pointer;
            line-height: 1;
        }

        .modal-body {
            padding: 24px;
            overflow-y: auto;
            font-size: 0.9rem;
            line-height: 1.6;
            color: var(--text-muted, #d1d5db);
        }

        .modal-body h4 {
            color: var(--text-primary, #ffffff);
            margin: 16px 0 8px 0;
            font-size: 0.95rem;
        }

        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid var(--border, rgba(255,255,255,0.1));
            display: flex;
            justify-content: flex-end;
            background: var(--bg-elevated, #1f2937);
        }

        .accept-btn {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .accept-btn:hover {
            opacity: 0.9;
        }
    `;

    static properties = {
        isOpen: { type: Boolean },
        onClose: { type: Function },
    };

    constructor() {
        super();
        this.isOpen = false;
        this.onClose = () => {};
    }

    render() {
        if (!this.isOpen) return html``;

        return html`
            <div class="modal-card">
                <div class="modal-header">
                    <h3>Terms & Conditions & User Responsibility Waiver</h3>
                    <button class="close-btn" @click=${this.onClose}>&times;</button>
                </div>
                <div class="modal-body">
                    <p>Welcome to <strong>Keyboard Master</strong>. By signing up, installing, or using this application, you explicitly agree to the following terms, conditions, and legal disclaimers:</p>

                    <h4>1. User Responsibility & Liability Waiver</h4>
                    <p>You assume <strong>100% full responsibility and liability</strong> for your use of Keyboard Master. The application developers, creators, and affiliates accept <strong>zero liability</strong> for any misuse, academic dishonesty, breach of examination guidelines, or violation of third-party rules.</p>

                    <h4>2. Acceptable Use Policy</h4>
                    <p>Keyboard Master is designed strictly as a personal productivity tool. You agree not to use this software in any environment where explicit prohibition exists or where usage violates institutional regulations.</p>

                    <h4>3. Remote Account Banning & Licensing</h4>
                    <p>We reserve the absolute right to suspend, terminate, or remotely disable any account or app instance found engaging in unauthorized distribution, security tampering, or platform policy violations without prior notice.</p>

                    <h4>4. Data Privacy</h4>
                    <p>We log device identifiers, system platform, and IP address strictly for license authentication, active instance tracking, and abuse prevention.</p>
                </div>
                <div class="modal-footer">
                    <button class="accept-btn" @click=${this.onClose}>I Understand & Agree</button>
                </div>
            </div>
        `;
    }
}

customElements.define('terms-modal', TermsModal);
