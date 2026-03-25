import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

export class CoworkArtifact extends LitElement {
  private _hass?: any;
  private _config?: any;
  private _cardElements: any[] = [];
  private _initialized = false;

  @property({ attribute: false })
  set hass(val: any) {
    this._hass = val;
    this._cardElements.forEach(el => {
      if (el) el.hass = val;
    });
  }
  get hass() {
    return this._hass;
  }

  @property({ attribute: false })
  set config(val: any) {
    if (JSON.stringify(val) === JSON.stringify(this._config)) {
        return; // Prevent unnecessary teardowns
    }
    console.log("CoworkArtifact: config setter called", val);
    this._config = val;
    if (this._initialized) {
        this._createCard();
    }
  }
  get config() {
    return this._config;
  }

  static styles = css`
    :host {
      display: block;
      margin: 12px 0;
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
      background-color: var(--card-background-color);
      box-shadow: var(--ha-card-box-shadow, 0 2px 2px 0 rgba(0,0,0,0.14));
      border: 1px solid var(--divider-color);
      min-height: 50px;
    }
    #card-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .error {
      padding: 16px;
      color: var(--error-color);
    }
  `;

  protected firstUpdated() {
    console.log("CoworkArtifact: firstUpdated");
    this._initialized = true;
    if (this._config) {
      this._createCard();
    }
  }

  private async _createCard() {
    if (!this._config) return;

    const container = this.shadowRoot?.getElementById('card-container');
    if (!container) {
        console.error("CoworkArtifact: container not found in shadowRoot");
        return;
    }

    try {
      container.innerHTML = '';
      this._cardElements = [];
      
      let helpers;
      if ((window as any).loadCardHelpers) {
          helpers = await (window as any).loadCardHelpers();
      }

      const configs = Array.isArray(this._config) ? this._config : [this._config];

      for (const conf of configs) {
          try {
            console.log(`CoworkArtifact: Creating ${conf.type} card element`);
            
            let processedConfig = { ...conf };
            
            let element: any;
            if (processedConfig.type === 'automation-proposal') {
                element = document.createElement('div');
                element.style.padding = '16px';
                element.style.fontFamily = 'monospace';
                element.innerHTML = `
                    <div style="margin-bottom: 12px; font-weight: bold; font-family: var(--paper-font-body1_-_font-family); font-size: 14px;">Proposed Automation Change:</div>
                    <div style="background: var(--primary-background-color); padding: 8px; border-radius: 8px; border: 1px solid var(--divider-color); overflow: hidden;">
                        <pre class="diff-block" style="margin: 0; padding: 0; overflow-x: auto; font-size: 13px; white-space: pre; line-height: 1.5; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;"></pre>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 16px;">
                        <button id="approve-btn" style="flex: 1; padding: 12px; border-radius: 24px; border: none; background-color: var(--success-color, #4caf50); color: white; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Approve Changes</button>
                        <button id="cancel-btn" style="flex: 1; padding: 12px; border-radius: 24px; border: none; background-color: var(--error-color, #f44336); color: white; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Cancel</button>
                    </div>
                `;
                
                let rawDiff = processedConfig.diff || "No changes.";
                // Robust newline splitting (handle actual newlines and literal \n strings)
                const lines = rawDiff.split(/\n|\\n/).map((line: string) => {
                    // Clean up potential HA-injected image path noise in @@ lines if it exists
                    let cleanLine = line;
                    if (line.includes('@@') && line.includes('.png')) {
                        cleanLine = line.replace(/@@.*?@@/, '@@');
                    }

                    if (cleanLine.startsWith('+')) {
                        return `<div style="color: var(--success-color, #4caf50); background-color: rgba(76, 175, 80, 0.15); padding: 0 4px;">${cleanLine}</div>`;
                    }
                    if (cleanLine.startsWith('-')) {
                        return `<div style="color: var(--error-color, #f44336); background-color: rgba(244, 67, 54, 0.15); padding: 0 4px;">${cleanLine}</div>`;
                    }
                    if (cleanLine.startsWith('@@')) {
                        return `<div style="color: var(--secondary-text-color); background-color: rgba(var(--rgb-primary-text-color), 0.05); font-style: italic; padding: 0 4px;">${cleanLine}</div>`;
                    }
                    return `<div style="padding: 0 4px; color: var(--primary-text-color); opacity: 0.8;">${cleanLine}</div>`;
                });
                
                element.querySelector('pre').innerHTML = lines.join('');
                
                const approveBtn = element.querySelector('#approve-btn');
                const cancelBtn = element.querySelector('#cancel-btn');
                
                approveBtn.addEventListener('click', async () => {
                    if (!this._hass) return;
                    approveBtn.innerText = 'Applying...';
                    approveBtn.disabled = true;
                    cancelBtn.disabled = true;
                    cancelBtn.style.opacity = '0.5';
                    try {
                        await this._hass.callWS({ 
                            type: "cowork/approve_proposal", 
                            proposal_id: processedConfig.proposal_id 
                        });
                        approveBtn.innerText = 'Approved & Applied!';
                        approveBtn.style.backgroundColor = 'var(--primary-color)';
                        cancelBtn.style.display = 'none';
                        
                        this.dispatchEvent(new CustomEvent('cowork-send-message', {
                            bubbles: true,
                            composed: true,
                            detail: { text: "I have approved and applied the changes. Please confirm completion or proceed with any remaining tasks." }
                        }));
                    } catch (e: any) {
                        approveBtn.innerText = 'Failed';
                        approveBtn.style.backgroundColor = 'var(--error-color, #f44336)';
                        cancelBtn.disabled = false;
                        cancelBtn.style.opacity = '1';
                        const err = document.createElement('div');
                        err.style.color = 'var(--error-color, #f44336)';
                        err.innerText = e.message || 'Unknown error';
                        element.appendChild(err);
                    }
                });

                cancelBtn.addEventListener('click', async () => {
                    if (!this._hass) return;
                    cancelBtn.innerText = 'Cancelling...';
                    approveBtn.disabled = true;
                    cancelBtn.disabled = true;
                    approveBtn.style.opacity = '0.5';
                    try {
                        await this._hass.callWS({ 
                            type: "cowork/cancel_proposal", 
                            proposal_id: processedConfig.proposal_id 
                        });
                        cancelBtn.innerText = 'Cancelled';
                        cancelBtn.style.backgroundColor = 'var(--secondary-text-color)';
                        approveBtn.style.display = 'none';
                        
                        this.dispatchEvent(new CustomEvent('cowork-send-message', {
                            bubbles: true,
                            composed: true,
                            detail: { text: "I have rejected the proposed changes. Please revise them or ask for clarification." }
                        }));
                    } catch (e: any) {
                        cancelBtn.innerText = 'Failed to Cancel';
                        approveBtn.disabled = false;
                        approveBtn.style.opacity = '1';
                        const err = document.createElement('div');
                        err.style.color = 'var(--error-color, #f44336)';
                        err.innerText = e.message || 'Unknown error';
                        element.appendChild(err);
                    }
                });
            } else if (helpers) {
                element = await helpers.createCardElement(processedConfig);
            } else {
                const tag = `hui-${processedConfig.type}-card`;
                element = document.createElement(tag);
                if (element.setConfig) {
                    element.setConfig(processedConfig);
                }
            }
            
            this._cardElements.push(element);
            container.appendChild(element);
            
            if (this._hass) {
              element.hass = this._hass;
            }
          } catch (itemErr: any) {
              console.error("CoworkArtifact Item Error:", itemErr);
              const errDiv = document.createElement('div');
              errDiv.className = 'error';
              errDiv.innerText = `Card Error (${conf.type}): ${itemErr.message}`;
              container.appendChild(errDiv);
          }
      }
      
      console.log("CoworkArtifact: Cards appended successfully");
    } catch (err: any) {
      console.error("CoworkArtifact Error:", err);
      container.innerHTML = `<div class="error">Render Error: ${err.message}</div>`;
    }
  }

  render() {
    return html`<div id="card-container"></div>`;
  }
}

if (!customElements.get('cowork-artifact')) {
    customElements.define('cowork-artifact', CoworkArtifact);
}
