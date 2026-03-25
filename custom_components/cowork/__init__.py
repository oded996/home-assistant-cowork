"""The Home Assistant Cowork integration."""
from __future__ import annotations

import logging
import time
import asyncio
import voluptuous as vol
from homeassistant.core import HomeAssistant, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import websocket_api, frontend, panel_custom, conversation
from homeassistant.components.http import StaticPathConfig
from homeassistant.helpers.storage import Store

from .const import DOMAIN
from .llm import CoworkAPI
from homeassistant.helpers import llm

_LOGGER = logging.getLogger(__name__)

HISTORY_STORAGE_KEY = "cowork.chat_history"
HISTORY_STORAGE_VERSION = 1

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Home Assistant Co-Work from a config entry."""
    _LOGGER.info("COWORK: async_setup_entry started")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry
    
    store = Store(hass, HISTORY_STORAGE_VERSION, HISTORY_STORAGE_KEY)
    hass.data[DOMAIN]["history_store"] = store
    history = await store.async_load()
    if history is None:
        history = {}
    hass.data[DOMAIN]["history"] = history
    
    try:
        api = CoworkAPI(hass)
        unreg = llm.async_register_api(hass, api)
        hass.data[DOMAIN]["llm_unreg"] = unreg
    except Exception as e:
        _LOGGER.warning("COWORK: Failed to register LLM API: %s", e)
    
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            "/cowork_static",
            hass.config.path("custom_components/cowork/www"),
            False
        )
    ])

    v = int(time.time())
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="cowork-panel",
        frontend_url_path=DOMAIN,
        module_url=f"/cowork_static/cowork-panel.js?v={v}",
        sidebar_title="Co-Work",
        sidebar_icon="mdi:robot",
        require_admin=False,
        config={},
    )

    websocket_api.async_register_command(hass, websocket_chat)
    websocket_api.async_register_command(hass, websocket_get_config)
    websocket_api.async_register_command(hass, websocket_get_agents)
    websocket_api.async_register_command(hass, websocket_get_history)
    websocket_api.async_register_command(hass, websocket_clear_history)
    websocket_api.async_register_command(hass, websocket_approve_proposal)
    websocket_api.async_register_command(hass, websocket_cancel_proposal)
    
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    _LOGGER.info("COWORK: async_setup_entry complete")
    return True

async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    if hasattr(frontend, "async_remove_panel"):
        frontend.async_remove_panel(hass, DOMAIN)
        
    unreg = hass.data[DOMAIN].get("llm_unreg")
    if unreg:
        unreg()
        
    hass.data[DOMAIN].pop(entry.entry_id)
    return True

async def _get_active_entry(hass: HomeAssistant) -> ConfigEntry | None:
    if DOMAIN in hass.data:
        for e in hass.data[DOMAIN].values():
            if isinstance(e, ConfigEntry):
                return e
    return None

def _fetch_agents_list_sync(hass: HomeAssistant):
    """Fetch agents list synchronously."""
    try:
        from homeassistant.components.conversation import get_agent_manager
        agent_manager = get_agent_manager(hass)
        agents = agent_manager.async_get_agent_info()
        
        if hasattr(agents, "__iter__") and not isinstance(agents, (str, bytes)):
            return list(agents)
        return [agents]
    except Exception as e:
        _LOGGER.error("COWORK: Error in _fetch_agents_list_sync: %s", e)
        return []

@websocket_api.websocket_command({
    vol.Required("type"): "cowork/get_agents",
})
@callback
def websocket_get_agents(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict
) -> None:
    """Handle get agents WebSocket command."""
    _LOGGER.info("COWORK: WS get_agents starting (sync callback)")
    try:
        agents_list = _fetch_agents_list_sync(hass)
        results = []
        for a in agents_list:
            results.append({"id": getattr(a, "id", "unknown"), "name": getattr(a, "name", "Unknown")})
        
        connection.send_result(msg["id"], {"agents": results})
    except Exception as e:
        _LOGGER.error("COWORK: Critical error in get_agents: %s", e)
        connection.send_error(msg["id"], "get_agents_failed", str(e))

@websocket_api.websocket_command({
    vol.Required("type"): "cowork/get_history",
})
@websocket_api.async_response
async def websocket_get_history(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict
) -> None:
    user_id = connection.user.id
    history = hass.data[DOMAIN]["history"].get(user_id, {"messages": [], "conversation_id": None})
    connection.send_result(msg["id"], history)

@websocket_api.websocket_command({
    vol.Required("type"): "cowork/clear_history",
})
@websocket_api.async_response
async def websocket_clear_history(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict
) -> None:
    user_id = connection.user.id
    if user_id in hass.data[DOMAIN]["history"]:
        del hass.data[DOMAIN]["history"][user_id]
        
    store = hass.data[DOMAIN]["history_store"]
    await store.async_save(hass.data[DOMAIN]["history"])
    connection.send_result(msg["id"], {"success": True})

@websocket_api.websocket_command({
    vol.Required("type"): "cowork/approve_proposal",
    vol.Required("proposal_id"): str,
})
@websocket_api.async_response
async def websocket_approve_proposal(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict
) -> None:
    import yaml
    proposal_id = msg["proposal_id"]
    proposals = hass.data[DOMAIN].get("proposals", {})
    if proposal_id not in proposals:
        connection.send_error(msg["id"], "not_found", "Proposal not found or expired.")
        return
        
    proposal = proposals[proposal_id]
    
    if isinstance(proposal, dict) and proposal.get("action_type") == "edit_yaml":
        filepath = proposal.get("filepath")
        new_content = proposal.get("content")
        
        def _update_file():
            full_path = hass.config.path(filepath)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(new_content)
                
        try:
            await hass.async_add_executor_job(_update_file)
            
            # Try to reload based on filename
            if filepath == "configuration.yaml":
                await hass.services.async_call("homeassistant", "reload_core_config")
            elif filepath == "scripts.yaml":
                await hass.services.async_call("script", "reload")
            elif filepath == "groups.yaml":
                await hass.services.async_call("group", "reload")
                
            del proposals[proposal_id]
            connection.send_result(msg["id"], {"success": True})
        except Exception as e:
            connection.send_error(msg["id"], "save_failed", str(e))
        return
        
    # Backwards compatibility for automation proposals
    if isinstance(proposal, dict) and proposal.get("action_type") == "automation":
        new_auto = proposal["data"]
    else:
        new_auto = proposal
        
    auto_id = str(new_auto.get("id"))
    
    def _update_yaml():
        filepath = hass.config.path("automations.yaml")
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or []
        except Exception:
            data = []
            
        updated = False
        for i, auto in enumerate(data):
            if str(auto.get("id")) == auto_id:
                data[i] = new_auto
                updated = True
                break
                
        if not updated:
            data.append(new_auto)
            
        with open(filepath, "w", encoding="utf-8") as f:
            yaml.safe_dump(data, f, default_flow_style=False, sort_keys=False)
            
    try:
        await hass.async_add_executor_job(_update_yaml)
        await hass.services.async_call("automation", "reload")
        del proposals[proposal_id]
        connection.send_result(msg["id"], {"success": True})
    except Exception as e:
        connection.send_error(msg["id"], "save_failed", str(e))

@websocket_api.websocket_command({
    vol.Required("type"): "cowork/cancel_proposal",
    vol.Required("proposal_id"): str,
})
@websocket_api.async_response
async def websocket_cancel_proposal(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict
) -> None:
    proposal_id = msg["proposal_id"]
    proposals = hass.data[DOMAIN].get("proposals", {})
    if proposal_id in proposals:
        del proposals[proposal_id]
    connection.send_result(msg["id"], {"success": True})

@websocket_api.websocket_command({
    vol.Required("type"): "cowork/get_config",
    vol.Optional("conversation_agent"): str,
})
@websocket_api.async_response
async def websocket_get_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict
) -> None:
    """Handle get/set config WebSocket command."""
    _LOGGER.info("COWORK: WS get_config called")
    entry = await _get_active_entry(hass)
    
    if entry and "conversation_agent" in msg:
        new_options = dict(entry.options)
        new_options["conversation_agent"] = msg["conversation_agent"]
        hass.config_entries.async_update_entry(entry, options=new_options)

    agent_id = entry.options.get("conversation_agent") if entry else None
    
    agent_name = "Default HA"
    if agent_id:
        agents = _fetch_agents_list_sync(hass)
        for a in agents:
            if getattr(a, "id", None) == agent_id:
                agent_name = getattr(a, "name", "Unknown")
                break
    
    connection.send_result(msg["id"], {
        "agent_name": agent_name,
        "agent_id": agent_id
    })

@websocket_api.websocket_command({
    vol.Required("type"): "cowork/chat",
    vol.Required("text"): str,
    vol.Optional("conversation_id"): vol.Any(str, None),
})
@websocket_api.async_response
async def websocket_chat(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict
) -> None:
    """Handle chat WebSocket command."""
    text = msg["text"]
    conversation_id = msg.get("conversation_id")
    entry = await _get_active_entry(hass)
    agent_id = entry.options.get("conversation_agent") if entry else None

    try:
        _LOGGER.info("COWORK: Chat starting. text=%s agent_id=%s conversation_id=%s", text, agent_id, conversation_id)

        # Improved RAG: Find matching entities including area
        search_terms = [w.lower() for w in text.split() if len(w) > 2 and w.lower() not in ["the", "show", "what", "is", "for", "my", "are", "all", "devices", "in"]]
        if "kitchen" in search_terms and "light" not in search_terms:
            search_terms.append("light")
        if "solar" in search_terms or "power" in search_terms or "energy" in search_terms:
            search_terms.extend(["power", "energy", "production", "solar"])
            
        # Deduplicate terms
        search_terms = list(set(search_terms))
            
        _LOGGER.info("COWORK: RAG Searching for terms: %s", search_terms)
        
        exclude_keywords = ["firmware", "rx", "tx", "dropped", "round_trip", "rssi", "last_seen", "accumulated", "commands", "timed_out", "connection", "link_quality"]
        
        is_automation_query = "automation" in text.lower()
        
        from homeassistant.helpers import entity_registry as er
        from homeassistant.helpers import device_registry as dr
        from homeassistant.helpers import area_registry as ar
        
        ent_reg = er.async_get(hass)
        dev_reg = dr.async_get(hass)
        area_reg = ar.async_get(hass)
        
        matches = []
        for state in hass.states.async_all():
            entity_id = state.entity_id.lower()
            friendly_name = (state.attributes.get("friendly_name") or "").lower()
            device_class = (state.attributes.get("device_class") or "").lower()
            
            # Skip diagnostics unless specifically asked
            if any(k in entity_id for k in exclude_keywords):
                continue
                
            # Get area name
            area_name = ""
            entity = ent_reg.async_get(state.entity_id)
            if entity:
                area_id = entity.area_id
                if not area_id and entity.device_id:
                    device = dev_reg.async_get(entity.device_id)
                    if device:
                        area_id = device.area_id
                if area_id:
                    area = area_reg.async_get_area(area_id)
                    if area:
                        area_name = area.name.lower()
            
            score = 0
            for term in search_terms:
                if term in entity_id: score += 15
                if term in friendly_name: score += 10
                if term in area_name: score += 15
                if term in device_class: score += 10
                if entity_id.startswith(f"{state.domain}.{term}"): score += 20
                
            if score > 0:
                # Bonus for primary domains
                if state.domain in ["light", "switch", "lock", "cover", "climate", "media_player"]:
                    score += 50
                
                # Big bonus for automations if user is asking for one
                if state.domain == "automation":
                    if is_automation_query:
                        score += 100
                    else:
                        score -= 20 # De-prioritize automations for general device queries
                        
                area_str = f", Area: {area_name}" if area_name else ""
                class_str = f", Class: {device_class}" if device_class else ""
                matches.append((score, f"{state.entity_id} (Name: {state.attributes.get('friendly_name', 'Unknown')}{area_str}{class_str}, State: {state.state})"))
        
        # Sort by score descending
        matches.sort(key=lambda x: x[0], reverse=True)
        found_states = [m[1] for m in matches]
        
        _LOGGER.info("COWORK: RAG found %s matching entities. Top score: %s", len(found_states), matches[0][0] if matches else 0)
                
        # Build Augmented Prompt with Context at the TOP
        context_block = ""
        if found_states:
            context_block = "--- SYSTEM CONTEXT: REAL ENTITIES IN USER'S HOUSE ---\n" + "\n".join(found_states[:40]) + "\n------------------------------------------\n\n"
            
        system_instruction = (
            "INSTRUCTIONS: You are the Home Assistant Co-Work Administrator Agent. "
            "You have access to the real entities listed in the SYSTEM CONTEXT above. "
            "1. ALWAYS respond with conversational text. "
            "2. In ANY interaction with a device (showing, controlling, querying, or asking for history), you MUST output a UI card showing the device or graph. "
            "   Format for devices: output exactly ONE JSON array containing ALL entities at the end of your message in a markdown block: ```json\n[{\"type\": \"tile\", \"entity\": \"light.a\"}, {\"type\": \"tile\", \"entity\": \"light.b\"}]\n``` (Use 'thermostat' type for climate devices). "
            "   Format for history/graphs: output exactly ONE JSON array at the end of your message in a markdown block using the 'sensor' card: ```json\n[{\"type\": \"sensor\", \"entity\": \"climate.bedroom\", \"graph\": \"line\", \"hours_to_show\": 168}]\n``` "
            "3. For other UI elements (automations), use `cowork_get_skills_list` and `cowork_read_skill` tools to learn the JSON format. "
            "4. If a tool returns a specific UI JSON block to display, you MUST output it EXACTLY as provided in your conversational response. "
            "5. For automations: Search in `automations.yaml` using `cowork_get_automation_config`, read the YAML, then use the 'automations' skill to display it. "
            "6. USE THE EXACT ENTITY_ID FROM THE CONTEXT ABOVE. "
            "7. Before answering questions about the past, ALWAYS use cowork_get_history to see the actual data points.\n\n"
            f"USER QUERY: {text}"
        )
        
        augmented_text = context_block + system_instruction
        _LOGGER.info("COWORK: Final Augmented Prompt Length: %s", len(augmented_text))


        result = await conversation.async_converse(
            hass=hass,
            text=augmented_text,
            conversation_id=conversation_id,
            device_id=None,
            context=connection.context(msg),
            agent_id=agent_id,
        )
        _LOGGER.info("COWORK: async_converse result object: %s", result)

        response_dict = result.response.as_dict()
        _LOGGER.info("COWORK: result.response.as_dict(): %s", response_dict)

        speech_data = response_dict.get("speech", {})

        response_text = "I'm sorry, I couldn't process that."
        if isinstance(speech_data, dict):
            response_text = speech_data.get("plain", {}).get("speech", response_text)
        elif isinstance(speech_data, str):
            response_text = speech_data

        _LOGGER.info("COWORK: Raw response_text before parsing artifacts: %s", response_text)

        # If response_text is "Unable to get response" or similar, maybe add info about why
        if response_text == "Unable to get response":
            _LOGGER.warning("COWORK: LLM agent returned 'Unable to get response'.")
            if result.response.response_type.value != "action_done":
                response_text += f" (Agent error: {result.response.response_type.value})"

        import re
        import json

        ui_artifact = []
        
        # 1. Extract all markdown JSON blocks
        for match in reversed(list(re.finditer(r'```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```', response_text, re.DOTALL))):
            try:
                parsed = json.loads(match.group(1))
                if isinstance(parsed, list):
                    ui_artifact.extend(parsed)
                else:
                    ui_artifact.append(parsed)
                response_text = response_text[:match.start()] + response_text[match.end():]
            except json.JSONDecodeError:
                _LOGGER.warning("COWORK: Failed to parse JSON code block.")
                
        # 2. Extract raw inline JSON arrays that look like UI configs
        for match in reversed(list(re.finditer(r'(\[\s*\{\s*"type".*?\}\s*\])', response_text, re.DOTALL))):
            try:
                parsed = json.loads(match.group(1))
                if isinstance(parsed, list):
                    ui_artifact.extend(parsed)
                else:
                    ui_artifact.append(parsed)
                response_text = response_text[:match.start()] + response_text[match.end():]
            except json.JSONDecodeError:
                pass
                
        # 3. Fallback for entire response being a JSON array
        cleaned_text = response_text.strip()
        if cleaned_text.startswith("[") and cleaned_text.endswith("]"):
            try:
                parsed = json.loads(cleaned_text)
                if isinstance(parsed, list):
                    ui_artifact.extend(parsed)
                else:
                    ui_artifact.append(parsed)
                response_text = "Here are the requested devices:"
            except json.JSONDecodeError:
                pass
            
        response_text = response_text.strip()
        
        # Inject pending proposals automatically
        pending_proposals = hass.data[DOMAIN].pop("pending_proposals", [])
        for prop in pending_proposals:
            ui_artifact.append({
                "type": "automation-proposal",
                "proposal_id": prop["id"],
                "diff": prop["diff"]
            })
            
        # Fallback: extract native intent success targets if no UI was generated
        if not ui_artifact:
            try:
                if getattr(result.response, "response_type", None) and result.response.response_type.value == "action_done":
                    success_targets = (response_dict.get("data") or {}).get("success", [])
                    for target in success_targets:
                        ent_id = target.get("id")
                        if ent_id and isinstance(ent_id, str):
                            card_type = "thermostat" if ent_id.startswith("climate.") else "tile"
                            ui_artifact.append({"type": card_type, "entity": ent_id})
                            
                # Secondary Failsafe: If STILL no UI, but the user asked to see a device, auto-inject the top RAG match
                if not ui_artifact and matches:
                    text_lower = text.lower()
                    if any(kw in text_lower for kw in ["show", "view", "what", "adjust", "set", "turn"]):
                        top_entity_id = matches[0][1].split(" ")[0]
                        card_type = "thermostat" if top_entity_id.startswith("climate.") else "tile"
                        ui_artifact.append({"type": card_type, "entity": top_entity_id})
                        _LOGGER.info("COWORK: Failsafe triggered. Auto-injected card for %s", top_entity_id)

            except Exception as e:
                _LOGGER.error("COWORK: Failed to extract native intent targets: %s", e)
            
        if not ui_artifact:
            ui_artifact = None

        # Save History
        user_id = connection.user.id
        history_data = hass.data[DOMAIN]["history"].setdefault(user_id, {"messages": [], "conversation_id": conversation_id})
        new_conv_id = getattr(result, "conversation_id", None)
        
        # update conv id if given
        if new_conv_id:
            history_data["conversation_id"] = new_conv_id

        history_data["messages"].append({
            "text": text,
            "fromUser": True
        })
        history_data["messages"].append({
            "text": response_text,
            "fromUser": False,
            "ui": ui_artifact
        })

        if len(history_data["messages"]) > 200:
            history_data["messages"] = history_data["messages"][-200:]
            
        store = hass.data[DOMAIN]["history_store"]
        hass.async_create_task(store.async_save(hass.data[DOMAIN]["history"]))

        connection.send_result(
            msg["id"],
            {
                "text": response_text,
                "ui": ui_artifact,
                "conversation_id": new_conv_id
            }
        )
        
    except Exception as err:
        _LOGGER.error("COWORK: Error in chat: %s", err)
        connection.send_result(msg["id"], {"text": f"Error: {str(err)}"})
