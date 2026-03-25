# Skill: Controls and Dashboards
This skill allows you to control devices and create temporary dashboards.

## Overview
You can render interactive Home Assistant UI cards directly in the chat to control devices or create temporary dashboards. This is your primary mechanism for showing devices to the user.

## Rules
1. ALWAYS respond with conversational text explaining what you are doing.
2. To show UI elements, you MUST include a JSON block containing a JSON ARRAY of card configurations:
```json
[
  {"type": "tile", "entity": "light.kitchen_1"},
  {"type": "tile", "entity": "light.kitchen_2"}
]
```
3. For controllable devices (lights, switches, locks, etc.), use 'tile' cards. For climate devices use 'thermostat' or 'tile' cards.
4. IMPORTANT: If multiple devices are relevant to the user's query, include ALL of them as individual cards within the JSON array. Do not be lazy.
5. In ANY interaction with a device (such as turning it on/off, changing settings, or just checking its status), you MUST render a UI card for that device.