import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './artifact';

interface ChatMessage {
  text: string;
  fromUser: boolean;
  ui?: any;
}

export class CoworkPanel extends LitElement {
  @property({ attribute: false }) public hass?: any;
  @property({ attribute: false }) public narrow?: boolean;
  @property({ attribute: false }) public route?: any;
  @property({ attribute: false }) public panel?: any;

  @state() private _isSending: boolean = false;
  @state() private _agents: any[] = [];
  @state() private _currentAgentId: string = '';
  @state() private _messages: ChatMessage[] = [];
  @state() private _conversationId: string = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--primary-background-color);
      color: var(--primary-text-color);
    }
    .header {
      padding: 8px 16px;
      font-size: 12px;
      color: var(--secondary-text-color);
      border-bottom: 1px solid var(--divider-color);
      background-color: var(--card-background-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    select {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border: none;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: bold;
      outline: none;
      cursor: pointer;
    }
    .clear-btn {
      background: var(--error-color, #f44336);
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
    }
    #chat-log {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 85%;
    }
    .message-wrapper.user {
      align-self: flex-end;
    }
    .message-wrapper.bot {
      align-self: flex-start;
    }
    .message {
      padding: 12px 16px;
      border-radius: 18px;
      line-height: 1.4;
      font-size: 15px;
      background-color: var(--secondary-background-color);
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      white-space: pre-wrap;
    }
    .message pre {
      background: var(--primary-background-color);
      padding: 8px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: monospace;
      font-size: 13px;
      border: 1px solid var(--divider-color);
      margin: 8px 0;
    }
    .message code {
      background: var(--primary-background-color);
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .user .message {
      background-color: var(--primary-color);
      color: var(--text-primary-color);
    }
    .bot .message {
      border-bottom-left-radius: 4px;
    }
    .input-area {
      padding: 16px;
      display: flex;
      gap: 12px;
      background-color: var(--card-background-color);
      border-top: 1px solid var(--divider-color);
    }
    input {
      flex: 1;
      padding: 12px 16px;
      border-radius: 24px;
      border: 1px solid var(--divider-color);
      background-color: var(--primary-background-color);
      color: var(--primary-text-color);
      font-size: 16px;
    }
    .send-btn {
      padding: 10px 24px;
      border-radius: 24px;
      border: none;
      background-color: var(--primary-color);
      color: var(--text-primary-color);
      cursor: pointer;
      font-weight: 600;
    }
  `;

  protected firstUpdated() {
    console.log("Cowork Panel v3.2.9 Loaded");
    const btn = this.shadowRoot?.getElementById('send-btn-manual');
    if (btn) {
      btn.onclick = () => this._sendMessage();
    }
    
    this._init();
  }

  private async _clearHistory() {
    try {
      await this.hass.callWS({ type: "cowork/clear_history" });
      this._messages = [];
      this._conversationId = '';
      this._addMessage("History cleared. v3.2.9 active.", false);
    } catch (err: any) {
      this._addMessage(`Failed to clear history: ${err.message}`, false);
    }
  }

  protected updated(changedProps: Map<string | number | symbol, unknown>) {
    super.updated(changedProps);
    if (changedProps.has('_messages')) {
      const log = this.shadowRoot?.getElementById('chat-log');
      if (log) {
        setTimeout(() => {
          log.scrollTop = log.scrollHeight;
        }, 50);
      }
    }
  }

  private async _init() {
    if (!this.hass) {
        setTimeout(() => this._init(), 500);
        return;
    }
    
    try {
        console.log("COWORK: Calling get_agents...");
        const agentsRes = await this.hass.callWS({ type: "cowork/get_agents" });
        console.log("COWORK: agentsRes success", agentsRes);
        this._agents = agentsRes.agents || [];

        console.log("COWORK: Calling get_config...");
        const configRes = await this.hass.callWS({ type: "cowork/get_config" });
        console.log("COWORK: configRes success", configRes);
        this._currentAgentId = configRes.agent_id || '';

        console.log("COWORK: Calling get_history...");
        const historyRes = await this.hass.callWS({ type: "cowork/get_history" });
        if (historyRes.messages && historyRes.messages.length > 0) {
            this._messages = historyRes.messages;
            this._conversationId = historyRes.conversation_id || '';
        } else {
            this._addMessage("v3.2.9 active. Server history loaded.", false);
        }
        
        this.requestUpdate();
        
    } catch (err: any) {
        console.error("COWORK: Init WS error", err);
        this._addMessage(`WS Error: ${err.message || 'Unknown'}. Try reloading integration.`, false);
    }
  }

  private async _handleAgentChange(e: Event) {
    const newAgentId = (e.target as HTMLSelectElement).value;
    console.log("COWORK: UI switching agent to", newAgentId);
    this._currentAgentId = newAgentId;
    this.requestUpdate();
    try {
        await this.hass.callWS({ 
            type: "cowork/get_config", 
            conversation_agent: newAgentId 
        });
        this._addMessage(`Success: Agent set to ${newAgentId}`, false);
    } catch (err: any) {
        console.error("COWORK: Switch error", err);
        this._addMessage(`Failed to switch: ${err.message}`, false);
    }
  }

  private _addMessage(text: string, fromUser: boolean, ui?: any) {
    this._messages = [...this._messages, { text, fromUser, ui }];
    // Server handles persistence now
    this.requestUpdate();
  }

  private _formatText(text: string) {
    if (!text) return '';
    let escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Add custom parsing for Diff blocks to color them natively
    escaped = escaped.replace(/```diff\n([\s\S]*?)```/g, (_, p1) => {
        const lines = p1.split('\n').map((line: string) => {
            if (line.startsWith('+')) return `<span style="color: var(--success-color, #4caf50); background-color: rgba(76, 175, 80, 0.1); display: block;">${line}</span>`;
            if (line.startsWith('-')) return `<span style="color: var(--error-color, #f44336); background-color: rgba(244, 67, 54, 0.1); display: block;">${line}</span>`;
            return `<span style="display: block;">${line}</span>`;
        });
        return `<pre class="diff-block">${lines.join('')}</pre>`;
    });
    
    escaped = escaped.replace(/```(?:yaml|json|text)?\n([\s\S]*?)```/g, '<pre>$1</pre>');
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    return unsafeHTML(escaped);
  }

  render() {
    return html`
      <div class="header">
        <div class="header-left">
          <span>Cowork v3.2.9</span>
        </div>
        <div class="header-right">
          <select @change="${this._handleAgentChange}">
            <option value="">Choose Agent...</option>
            ${this._agents.map(agent => html`
              <option value="${agent.id}" ?selected="${agent.id === this._currentAgentId}">
                ${agent.name}
              </option>
            `)}
          </select>
          <button class="clear-btn" @click="${this._clearHistory}">Clear</button>
        </div>
      </div>
      <div id="chat-log">
        ${this._messages.map(msg => html`
          <div class="message-wrapper ${msg.fromUser ? 'user' : 'bot'}">
            ${msg.text ? html`<div class="message">${this._formatText(msg.text)}</div>` : ''}
            ${msg.ui ? html`<cowork-artifact .hass=${this.hass} .config=${msg.ui} @cowork-send-message=${(e: CustomEvent) => this._sendMessage(e.detail.text)}></cowork-artifact>` : ''}
          </div>
        `)}
      </div>
      <div class="input-area">
        <input 
          id="chat-input-manual"
          type="text" 
          @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this._sendMessage()}"
          placeholder="Type here..."
        />
        <button id="send-btn-manual" class="send-btn">
          ${this._isSending ? '...' : 'Send'}
        </button>
      </div>
    `;
  }

  private async _sendMessage(providedText?: string) {
    if (this._isSending) return;
    const inputEl = this.shadowRoot?.getElementById('chat-input-manual') as HTMLInputElement;
    let text = providedText;
    if (!text && inputEl) {
        text = inputEl.value.trim();
        inputEl.value = '';
    }
    if (!text) return;

    this._addMessage(text, true);
    this._isSending = true;

    try {
        const payload: any = { type: "cowork/chat", text: text };
        if (this._conversationId) {
            payload.conversation_id = this._conversationId;
        }
        const response = await this.hass.callWS(payload);

        if (response.conversation_id) {
            this._conversationId = response.conversation_id;
        }

        this._addMessage(response.text, false, response.ui);
    } catch (err: any) {
        this._addMessage(`Error: ${err.message}`, false);
    } finally {
        this._isSending = false;
    }
  }}

if (!customElements.get('cowork-panel')) {
    customElements.define('cowork-panel', CoworkPanel);
}
