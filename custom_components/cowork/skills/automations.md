# Skill: Manage Automations
This skill allows you to read, create, update, and display Home Assistant automations.

## Reading Automations
1. To read an existing automation, you MUST use the `cowork_get_automation_config` tool. Provide the automation's `alias` (e.g. "Hallway lights automation") or `id`. 
2. The tool will return the exact, complete YAML block. You MUST read this YAML before proposing any edits to ensure you don't break existing logic.
3. If the tool returns multiple matches, ask the user to clarify which one they mean.
4. To find the exact `entity_id` for an automation, use `cowork_search_entities`.

## Creating / Updating Automations
IMPORTANT: Editing or creating an automation is a strict 2-step process.

**Step 1: Propose the Change**
1. Do NOT write YAML directly to the chat as your final response.
2. Call the `cowork_propose_automation` tool. 
   - `yaml_config`: Pass the FULL updated automation logic as a complete YAML string.
   - `automation_id`: To update an existing automation, you MUST provide its `id`.
3. The system will AUTOMATICALLY show the user a diff and an approval button. You DO NOT need to output any JSON cards for the proposal.
4. Simply explain the changes you are proposing in your conversational text.

**Step 2: Approval**
The user will click the "Approve Changes" or "Cancel" button in the UI card. 
The system will then AUTOMATICALLY send you a message confirming whether the changes were applied or rejected. 
You must acknowledge this message and continue with any remaining tasks or ask the user what else they need. Do not ask for text approval.

## Displaying Automations
To show an automation's current state:
1. Output the YAML code block in your text.
2. Include a JSON array with a `tile` card and a `logbook` card (using `target: {entity_id: [...]}`).
