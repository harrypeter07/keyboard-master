import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class PricingModal extends LitElement {
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
            max-width: 650px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            overflow: hidden;
            color: var(--text-primary, #f9fafb);
            font-family: var(--font, sans-serif);
        }

        .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border, rgba(255,255,255,0.1));
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-elevated, #1f2937);
        }

        .modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .close-btn {
            background: none;
            border: none;
            color: var(--text-muted, #9ca3af);
            font-size: 1.5rem;
            cursor: pointer;
        }

        .plans-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            padding: 24px;
        }

        .plan-card {
            background: var(--bg-elevated, #1f2937);
            border: 1px solid var(--border, rgba(255,255,255,0.1));
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            position: relative;
            transition: transform 0.2s, border-color 0.2s;
        }

        .plan-card:hover {
            transform: translateY(-2px);
            border-color: #3b82f6;
        }

        .plan-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .plan-name {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .plan-price {
            font-size: 1.8rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 12px;
        }

        .plan-price span {
            font-size: 0.85rem;
            color: var(--text-muted, #9ca3af);
            font-weight: 400;
        }

        .plan-features {
            list-style: none;
            padding: 0;
            margin: 0 0 20px 0;
            font-size: 0.82rem;
            color: var(--text-muted, #d1d5db);
        }

        .plan-features li {
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .subscribe-btn {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            margin-top: auto;
            transition: opacity 0.2s;
        }

        .subscribe-btn:hover {
            opacity: 0.9;
        }
    `;

    static properties = {
        isOpen: { type: Boolean },
        weeklyPrice: { type: Number },
        monthlyPrice: { type: Number },
        onClose: { type: Function },
        onSelectPlan: { type: Function },
    };

    constructor() {
        super();
        this.isOpen = false;
        this.weeklyPrice = 499;
        this.monthlyPrice = 1499;
        this.onClose = () => {};
        this.onSelectPlan = () => {};
    }

    render() {
        if (!this.isOpen) return html``;

        return html`
            <div class="modal-card">
                <div class="modal-header">
                    <h3>Keyboard Master Pro Plans</h3>
                    <button class="close-btn" @click=${this.onClose}>&times;</button>
                </div>
                <div class="plans-grid">
                    <div class="plan-card">
                        <div class="plan-badge">Popular</div>
                        <div class="plan-name">Weekly Pass</div>
                        <div class="plan-price">₹${this.weeklyPrice} <span>/ week</span></div>
                        <ul class="plan-features">
                            <li>✓ Unlimited Cloud AI Access</li>
                            <li>✓ No Gemini API Key Needed</li>
                            <li>✓ Smart Failover Priority</li>
                            <li>✓ 7 Days Full License</li>
                        </ul>
                        <button class="subscribe-btn" @click=${() => this.onSelectPlan('weekly')}>Subscribe Weekly</button>
                    </div>

                    <div class="plan-card">
                        <div class="plan-badge" style="background: rgba(16,185,129,0.2); color: #10b981;">Best Value</div>
                        <div class="plan-name">Monthly VIP</div>
                        <div class="plan-price">₹${this.monthlyPrice} <span>/ month</span></div>
                        <ul class="plan-features">
                            <li>✓ Unlimited Cloud AI Access</li>
                            <li>✓ No Gemini API Key Needed</li>
                            <li>✓ 24/7 Priority Support</li>
                            <li>✓ Save over 30% vs Weekly</li>
                        </ul>
                        <button class="subscribe-btn" style="background: linear-gradient(135deg, #10b981, #3b82f6);" @click=${() => this.onSelectPlan('monthly')}>Subscribe Monthly</button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('pricing-modal', PricingModal);
