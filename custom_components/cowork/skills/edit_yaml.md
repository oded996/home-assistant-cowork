# Skill: Edit YAML Configuration Files
This skill allows you to safely edit any YAML configuration file in the Home Assistant `/config` directory (e.g., `configuration.yaml`, `scripts.yaml`, `groups.yaml`).

## Reading Files
Use the `cowork_read_file` tool to retrieve the current contents of the YAML file before making any edits. Always review the full file to ensure you don't accidentally overwrite or break existing configurations.

## Making Edits
IMPORTANT: Editing a YAML file is a strict 2-step process to ensure safety.

**Step 1: Propose the Change**
1. Do NOT write the final YAML directly to the chat.
2. Call the `cowork_propose_yaml_edit` tool.
   - `filepath`: The relative path to the file (e.g., `configuration.yaml`).
   - `yaml_content`: The complete, fully updated YAML content for the entire file. You MUST provide the full file contents, including all the existing sections you did not change.
3. The system will AUTOMATICALLY show the user a diff and an approval button. You DO NOT need to output any JSON cards for the proposal.
4. Simply explain the changes you are proposing in your conversational text.

**Step 2: Approval**
The user will click the "Approve Changes" or "Cancel" button in the UI card. 
The system will then AUTOMATICALLY send you a message confirming whether the changes were applied or rejected. 
You must acknowledge this message and continue with any remaining tasks. Do not ask for text approval.