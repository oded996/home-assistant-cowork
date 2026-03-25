"""Config flow for Home Assistant Cowork."""
from __future__ import annotations

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.components import conversation

from .const import DOMAIN

class CoworkConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Home Assistant Cowork."""

    VERSION = 1

    async def async_step_user(self, user_input: dict | None = None) -> FlowResult:
        """Handle the initial step."""
        if user_input is not None:
            return self.async_create_entry(title="Home Assistant Cowork", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({}),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry) -> CoworkOptionsFlowHandler:
        """Get the options flow for this handler."""
        return CoworkOptionsFlowHandler(config_entry)


class CoworkOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle Cowork options."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input: dict | None = None) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        # Get list of conversation agents
        from homeassistant.components.conversation import get_agent_manager
        agent_manager = get_agent_manager(self.hass)
        agents = agent_manager.async_get_agent_info()
        
        # Build dictionary for selection
        agent_dict = {agent.id: f"{agent.name} ({agent.id})" for agent in agents}
        
        # Current setting
        default_agent = self.config_entry.options.get("conversation_agent", "homeassistant")

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required("conversation_agent", default=default_agent): vol.In(agent_dict),
            }),
        )
