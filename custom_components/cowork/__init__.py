"""The Home Assistant Co-Work integration."""
from __future__ import annotations

import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Home Assistant Co-Work from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    
    # In Phase 1, we will register WebSocket endpoints here
    # and set up the custom panel.
    
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return True
