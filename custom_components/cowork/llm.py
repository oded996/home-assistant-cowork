import logging
import os
import subprocess
import voluptuous as vol
from homeassistant.core import HomeAssistant
from homeassistant.helpers import llm

_LOGGER = logging.getLogger(__name__)

# Register the API
API_ID = "cowork_api"

class CoworkAPI(llm.API):
    """Co-Work LLM API."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the API."""
        super().__init__(hass=hass, id=API_ID, name="Co-Work Administrator API")

    async def async_get_api_instance(self, llm_context: llm.LLMContext) -> llm.APIInstance:
        """Return the API instance."""
        _LOGGER.info("COWORK: async_get_api_instance called")
        return llm.APIInstance(
            api=self,
            api_prompt=(
                "You are the Home Assistant Co-Work Administrator Agent. "
                "Always reply with text. Use tools to query information when needed."
            ),
            llm_context=llm_context,
            tools=[
                GetSkillsListTool(),
                ReadSkillTool(),
                GetTimeTool(),
                SearchEntitiesTool(),
                GetHistoryTool(),
                ReadFileTool(),
                GetLogsTool(),
                SearchConfigTool(),
                RunHaCliTool(),
                GetAutomationConfigTool(),
                ProposeYamlEditTool(),
                ProposeAutomationTool(),
                GetAutomationTraceTool(),
            ],
        )

class GetSkillsListTool(llm.Tool):
    """Tool to list available skills."""

    name = "cowork_get_skills_list"
    description = "Get a list of available specialized skills (e.g. controls, history, compare). Use this if you are unsure how to render a card or perform a task."
    parameters = vol.Schema({})

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        """Execute the tool."""
        _LOGGER.info("COWORK: GetSkillsListTool called")
        skills_dir = os.path.join(os.path.dirname(__file__), "skills")
        if not os.path.exists(skills_dir):
            return {"skills": []}
            
        skills = []
        for file in os.listdir(skills_dir):
            if file.endswith(".md"):
                skills.append(file.replace(".md", ""))
        return {"available_skills": skills}

class ReadSkillTool(llm.Tool):
    """Tool to read the instructions for a specific skill."""

    name = "cowork_read_skill"
    description = "Read the documentation and rules for a specific skill by name (e.g. 'history', 'compare')."
    parameters = vol.Schema({
        vol.Required("skill_name"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        """Execute the tool."""
        skill_name = tool_input.tool_args["skill_name"]
        _LOGGER.info("COWORK: ReadSkillTool called for %s", skill_name)
        
        filepath = os.path.join(os.path.dirname(__file__), "skills", f"{skill_name}.md")
        if not os.path.exists(filepath):
            return {"error": f"Skill '{skill_name}' not found."}
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            return {"skill_instructions": content}
        except Exception as e:
            return {"error": str(e)}

class SearchEntitiesTool(llm.Tool):
    """Tool to search for entities in Home Assistant."""

    name = "cowork_search_entities"
    description = "Search for entities. Returns a list of entity IDs and names."
    parameters = vol.Schema({
        vol.Required("query"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        """Execute the tool."""
        _LOGGER.info("COWORK: SearchEntitiesTool called with %s", tool_input.tool_args)
        query = tool_input.tool_args["query"].lower()
        results = []
        for state in hass.states.async_all():
            if query in state.entity_id.lower() or query in state.attributes.get("friendly_name", "").lower():
                results.append({"entity_id": state.entity_id, "name": state.attributes.get("friendly_name")})
        return {"entities": results[:20]}

class GetTimeTool(llm.Tool):
    """Tool to get the current time."""

    name = "cowork_get_time"
    description = "Get the current time."
    parameters = vol.Schema({
        vol.Optional("dummy"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        """Execute the tool."""
        from datetime import datetime
        now = datetime.now()
        _LOGGER.info("COWORK: GetTimeTool called")
        return {"current_time": now.strftime("%Y-%m-%d %H:%M:%S")}

class GetHistoryTool(llm.Tool):
    """Tool to get historical data for an entity."""

    name = "cowork_get_history"
    description = "Get the history of an entity. Returns a list of state changes with timestamps."
    parameters = vol.Schema({
        vol.Required("entity_id"): str,
        vol.Optional("days", default=1): int,
        vol.Optional("end_days_ago", default=0): int,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        """Execute the tool."""
        entity_id = tool_input.tool_args["entity_id"]
        days = tool_input.tool_args.get("days", 1)
        end_days_ago = tool_input.tool_args.get("end_days_ago", 0)
        _LOGGER.info("COWORK: GetHistoryTool called for %s, days=%s, end_days_ago=%s", entity_id, days, end_days_ago)
        
        from homeassistant.components.recorder.history import get_significant_states
        import homeassistant.util.dt as dt_util
        from datetime import timedelta
        
        end = dt_util.utcnow() - timedelta(days=end_days_ago)
        start = end - timedelta(days=days)
        
        try:
            # Database calls are synchronous and must be run in the executor
            history_data = await hass.async_add_executor_job(
                get_significant_states,
                hass,
                start,
                end,
                [entity_id],
                None,
                True,  # include_start_time_state
                True,  # significant_changes_only
                True,  # minimal_response
                False, # no_attributes
                False, # compressed_state_format
            )
            
            if entity_id not in history_data:
                return {"success": False, "error": f"No history found for {entity_id}"}
                
            states = history_data[entity_id]
            results = []
            for s in states:
                # With minimal_response=True, the results are dicts
                if isinstance(s, dict):
                    results.append({
                        "state": s.get("state"),
                        "changed": str(s.get("last_changed"))
                    })
                else:
                    results.append({
                        "state": s.state,
                        "changed": s.last_changed.isoformat()
                    })
                
            return {"success": True, "history": results[:100]}
        except Exception as e:
            _LOGGER.error("COWORK: Error in GetHistoryTool: %s", e)
            return {"success": False, "error": str(e)}

class ReadFileTool(llm.Tool):
    """Tool to read files from the config directory."""

    name = "cowork_read_file"
    description = "Read the contents of a file within the Home Assistant /config directory."
    parameters = vol.Schema({
        vol.Required("filepath"): str,
        vol.Optional("start_line", default=1): int,
        vol.Optional("end_line", default=1000): int,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        """Execute the tool."""
        try:
            _LOGGER.info("COWORK: ReadFileTool called with %s", tool_input)
            filepath = tool_input.tool_args["filepath"]
            base_path = hass.config.config_dir
            full_path = os.path.abspath(os.path.join(base_path, filepath))
            if not full_path.startswith(base_path):
                return {"error": "Access denied. Can only read files within /config."}
            if not os.path.exists(full_path):
                return {"error": f"File '{filepath}' does not exist."}
            with open(full_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            start = max(0, tool_input.tool_args.get("start_line", 1) - 1)
            end = min(len(lines), tool_input.tool_args.get("end_line", 1000))
            content = "".join(lines[start:end])
            return {"content": content, "lines_read": len(lines[start:end])}
        except Exception as e:
            _LOGGER.error("COWORK: Error in ReadFileTool: %s", e)
            return {"error": str(e)}

class SearchConfigTool(llm.Tool):
    """Tool to search configuration files."""

    name = "cowork_search_config"
    description = "Search for a string pattern in all .yaml files in the /config directory."
    parameters = vol.Schema({
        vol.Required("pattern"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        """Execute the tool."""
        try:
            _LOGGER.info("COWORK: SearchConfigTool called with %s", tool_input)
            pattern = tool_input.tool_args["pattern"]
            base_path = hass.config.config_dir
            results = []
            for root, _, files in os.walk(base_path):
                if any(part.startswith('.') for part in root.split(os.sep)):
                    continue
                for file in files:
                    if file.endswith(".yaml"):
                        full_path = os.path.join(root, file)
                        try:
                            with open(full_path, "r", encoding="utf-8") as f:
                                for i, line in enumerate(f):
                                    if pattern in line:
                                        rel_path = os.path.relpath(full_path, base_path)
                                        results.append(f"{rel_path}:{i+1}: {line.strip()}")
                        except Exception:
                            pass
            if not results:
                return {"results_found": 0, "message": f"No matches found for '{pattern}'."}
            return {"results_found": len(results), "matches": results[:100]}
        except Exception as e:
            _LOGGER.error("COWORK: Error in SearchConfigTool: %s", e)
            return {"error": str(e)}

class RunHaCliTool(llm.Tool):
    """Tool to run HA CLI commands."""

    name = "cowork_run_ha_cli"
    description = "Execute a Home Assistant CLI command (e.g. 'ha core logs'). Only allowed 'ha' subcommands."
    parameters = vol.Schema({
        vol.Required("command"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        """Execute the tool."""
        try:
            _LOGGER.info("COWORK: RunHaCliTool called with %s", tool_input)
            command = tool_input.tool_args["command"]
            if not command.startswith("ha "):
                return {"error": "Only 'ha' commands are allowed."}
            if any(char in command for char in ["|", ">", "<", "&", ";"]):
                return {"error": "Invalid characters in command."}
            
            command = command.replace("ha ", "/usr/local/bin/ha ", 1)
            
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=10
            )
            output = result.stdout
            if result.stderr:
                output += f"\nSTDERR:\n{result.stderr}"
            return {"output": output[:4000], "exit_code": result.returncode}
        except Exception as e:
            _LOGGER.error("COWORK: Error in RunHaCliTool: %s", e)
            return {"error": str(e)}

class GetAutomationConfigTool(llm.Tool):
    """Tool to get the exact YAML configuration of an automation."""

    name = "cowork_get_automation_config"
    description = "Get the full YAML configuration for a specific automation by its alias or id. Use this before proposing edits."
    parameters = vol.Schema({
        vol.Optional("alias"): str,
        vol.Optional("id"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        import yaml
        try:
            _LOGGER.info("COWORK: GetAutomationConfigTool called with %s", tool_input)
            args = tool_input.tool_args
            search_alias = args.get("alias", "").lower()
            search_id = args.get("id", "")
            
            if not search_alias and not search_id:
                return {"error": "Must provide either 'alias' or 'id' to search for an automation."}
                
            def _read_auto():
                filepath = hass.config.path("automations.yaml")
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = yaml.safe_load(f) or []
                except Exception as e:
                    return None, None, str(e)
                
                matches = []
                for auto in data:
                    auto_id = str(auto.get("id", ""))
                    auto_alias = str(auto.get("alias", "")).lower()
                    
                    if search_id and search_id == auto_id:
                        return yaml.safe_dump([auto], sort_keys=False, default_flow_style=False), None, None
                        
                    if search_alias:
                        if search_alias == auto_alias:
                            # Exact match - return immediately
                            return yaml.safe_dump([auto], sort_keys=False, default_flow_style=False), None, None
                        if search_alias in auto_alias:
                            matches.append(auto)
                
                if len(matches) == 1:
                    return yaml.safe_dump([matches[0]], sort_keys=False, default_flow_style=False), None, None
                
                if len(matches) > 1:
                    options = [{"id": a.get("id"), "alias": a.get("alias")} for a in matches]
                    return None, options, "Multiple matches found. Please specify the ID."
                    
                return None, None, "Automation not found."
                
            yaml_str, options, error = await hass.async_add_executor_job(_read_auto)
            if error:
                if options:
                    return {"error": error, "matches": options}
                return {"error": error}
            return {"yaml_config": yaml_str}
        except Exception as e:
            _LOGGER.error("COWORK: Error in GetAutomationConfigTool: %s", e)
            return {"error": str(e)}

class GetLogsTool(llm.Tool):
    """Tool to read recent Home Assistant logs."""

    name = "cowork_get_logs"
    description = "Read the most recent lines from the Home Assistant log file to diagnose errors."
    parameters = vol.Schema({
        vol.Optional("lines", default=50): int,
        vol.Optional("grep_pattern"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        import os
        import subprocess
        import re
        import aiohttp
        
        try:
            _LOGGER.info("COWORK: GetLogsTool called with %s", tool_input)
            lines = tool_input.tool_args.get("lines", 50)
            pattern = tool_input.tool_args.get("grep_pattern")
            
            log_file = hass.config.path("home-assistant.log")
            
            def strip_ansi(text):
                ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                return ansi_escape.sub('', text)

            def filter_logs(log_text):
                log_lines = log_text.splitlines()
                if pattern:
                    try:
                        regex = re.compile(pattern, re.IGNORECASE)
                        log_lines = [l for l in log_lines if regex.search(l)]
                    except Exception:
                        pass
                return "\n".join(log_lines[-lines:])

            if not os.path.exists(log_file):
                supervisor_token = os.environ.get("SUPERVISOR_TOKEN")
                if supervisor_token:
                    url = "http://supervisor/core/logs"
                    headers = {"Authorization": f"Bearer {supervisor_token}"}
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url, headers=headers) as response:
                            if response.status == 200:
                                raw_logs = await response.text()
                                filtered = filter_logs(strip_ansi(raw_logs))
                                if pattern and not filtered:
                                    return {"logs": f"No logs found matching pattern '{pattern}' in the recent logs."}
                                return {"logs": filtered}
                            
                return {"error": "Log file not found and supervisor API failed."}

            def _read_logs():
                if pattern:
                    # Use grep for pattern matching
                    cmd = f"grep -i '{pattern}' '{log_file}' | tail -n {lines}"
                else:
                    cmd = f"tail -n {lines} '{log_file}'"
                
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    return {"logs": strip_ansi(result.stdout)}
                elif result.returncode == 1 and pattern:
                    return {"logs": f"No logs found matching pattern '{pattern}' in the last {lines} lines."}
                return {"logs": strip_ansi(result.stdout)} # Sometimes grep returns 1 even if tail works

            result_dict = await hass.async_add_executor_job(_read_logs)
            _LOGGER.info("COWORK: GetLogsTool returning length %s", len(str(result_dict)))
            return result_dict
            
        except Exception as e:
            _LOGGER.error("COWORK: Error in GetLogsTool: %s", e)
            return {"error": str(e)}

class ProposeYamlEditTool(llm.Tool):
    """Tool to propose a generic YAML file edit for user approval."""

    name = "cowork_propose_yaml_edit"
    description = "Propose an edit to any YAML file (e.g. configuration.yaml, scripts.yaml). The user MUST approve it in the UI."
    parameters = vol.Schema({
        vol.Required("filepath"): str,
        vol.Required("yaml_content"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        import uuid
        import difflib
        import os
        from .const import DOMAIN
        
        try:
            _LOGGER.info("COWORK: ProposeYamlEditTool called with %s", tool_input)
            args = tool_input.tool_args
            filepath = args["filepath"]
            new_yaml_str = args["yaml_content"]
            
            base_path = hass.config.config_dir
            full_path = os.path.abspath(os.path.join(base_path, filepath))
            
            if not full_path.startswith(base_path):
                return {"error": "Access denied. Can only edit files within /config."}
                
            def _get_diff():
                old_yaml_str = ""
                if os.path.exists(full_path):
                    with open(full_path, "r", encoding="utf-8") as f:
                        old_yaml_str = f.read()
                        
                diff = list(difflib.unified_diff(
                    old_yaml_str.splitlines(),
                    new_yaml_str.splitlines(),
                    fromfile=f'Current {filepath}',
                    tofile=f'Proposed {filepath}',
                    lineterm='',
                    n=5
                ))
                return "\n".join(diff) if diff else "No changes."
                
            diff_text = await hass.async_add_executor_job(_get_diff)
            proposal_id = uuid.uuid4().hex
            
            if "proposals" not in hass.data[DOMAIN]:
                hass.data[DOMAIN]["proposals"] = {}
                
            hass.data[DOMAIN]["proposals"][proposal_id] = {
                "action_type": "edit_yaml",
                "filepath": filepath,
                "content": new_yaml_str
            }
            
            if "pending_proposals" not in hass.data[DOMAIN]:
                hass.data[DOMAIN]["pending_proposals"] = []
            
            hass.data[DOMAIN]["pending_proposals"].append({
                "id": proposal_id,
                "diff": diff_text
            })
            
            return {
                "success": True,
                "message": f"Proposal created successfully for {filepath}. The system will AUTOMATICALLY display the diff UI to the user. You DO NOT need to output any JSON cards for this proposal. Just explain the changes you made in conversational text."
            }
            
        except Exception as e:
            _LOGGER.error("COWORK: Error in ProposeYamlEditTool: %s", e)
            return {"error": str(e)}

class ProposeAutomationTool(llm.Tool):
    """Tool to propose an automation change for user approval."""

    name = "cowork_propose_automation"
    description = "Propose an automation creation or update. The user MUST approve it in the UI before it is applied."
    parameters = vol.Schema({
        vol.Required("yaml_config"): str,
        vol.Optional("automation_id"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        import uuid
        import yaml
        import difflib
        import json
        from .const import DOMAIN
        
        try:
            _LOGGER.info("COWORK: ProposeAutomationTool called with %s", tool_input)
            args = tool_input.tool_args
            yaml_str = args["yaml_config"]
            auto_id = args.get("automation_id")
            
            try:
                new_auto = yaml.safe_load(yaml_str)
                if isinstance(new_auto, list) and len(new_auto) > 0:
                    new_auto = new_auto[0]
            except Exception as e:
                return {"error": f"Invalid YAML provided: {e}"}
                
            if not isinstance(new_auto, dict):
                 return {"error": "YAML must be a single dictionary representing the automation."}
                 
            # Fix common plural/singular LLM errors
            if "actions" in new_auto and "action" not in new_auto:
                new_auto["action"] = new_auto.pop("actions")
            if "triggers" in new_auto and "trigger" not in new_auto:
                new_auto["trigger"] = new_auto.pop("triggers")
            if "conditions" in new_auto and "condition" not in new_auto:
                new_auto["condition"] = new_auto.pop("conditions")
                
            if "action" not in new_auto:
                return {"error": "YAML must contain at least an 'action' or 'actions' key."}
                 
            if not auto_id and "id" in new_auto:
                auto_id = str(new_auto["id"])
            if not auto_id:
                auto_id = uuid.uuid4().hex
                
            new_auto["id"] = auto_id
            
            # Read old automations
            def _get_diff():
                filepath = hass.config.path("automations.yaml")
                old_yaml_str = ""
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = yaml.safe_load(f) or []
                        for a in data:
                            if str(a.get("id")) == str(auto_id):
                                old_yaml_str = yaml.safe_dump([a], sort_keys=False, default_flow_style=False)
                                break
                except Exception:
                    pass
                    
                new_yaml_str = yaml.safe_dump([new_auto], sort_keys=False, default_flow_style=False)
                
                diff = list(difflib.unified_diff(
                    old_yaml_str.splitlines(),
                    new_yaml_str.splitlines(),
                    fromfile='Current Automation',
                    tofile='Proposed Automation',
                    lineterm='',
                    n=5
                ))
                diff_text = "\n".join(diff) if diff else "No changes."
                _LOGGER.info("COWORK: Generated Diff:\n%s", diff_text)
                return diff_text
                
            diff_text = await hass.async_add_executor_job(_get_diff)
            proposal_id = uuid.uuid4().hex
            
            if "proposals" not in hass.data[DOMAIN]:
                hass.data[DOMAIN]["proposals"] = {}
                
            hass.data[DOMAIN]["proposals"][proposal_id] = new_auto
            
            if "pending_proposals" not in hass.data[DOMAIN]:
                hass.data[DOMAIN]["pending_proposals"] = []
            
            hass.data[DOMAIN]["pending_proposals"].append({
                "id": proposal_id,
                "diff": diff_text
            })
            
            return {
                "success": True,
                "message": "Proposal created successfully. The system will AUTOMATICALLY display the diff UI to the user. You DO NOT need to output any JSON cards for this proposal. Just explain the changes you made in conversational text."
            }
            
        except Exception as e:
            _LOGGER.error("COWORK: Error in ProposeAutomationTool: %s", e)
            return {"error": str(e)}

class GetAutomationTraceTool(llm.Tool):
    """Tool to get automation traces for debugging."""

    name = "cowork_get_trace"
    description = "Get the execution trace of an automation to debug failures."
    parameters = vol.Schema({
        vol.Required("entity_id"): str,
    })

    async def async_call(
        self, hass: HomeAssistant, tool_input: llm.ToolInput, llm_context: llm.LLMContext
    ) -> dict:
        import json
        import os
        try:
            _LOGGER.info("COWORK: GetAutomationTraceTool called with %s", tool_input)
            entity_id = tool_input.tool_args["entity_id"]
            
            # Find unique_id for this entity
            unique_id = None
            reg_path = hass.config.path(".storage/core.entity_registry")
            if os.path.exists(reg_path):
                with open(reg_path, "r", encoding="utf-8") as f:
                    reg_data = json.load(f)
                    for ent in reg_data.get("data", {}).get("entities", []):
                        if ent.get("entity_id") == entity_id:
                            unique_id = ent.get("unique_id")
                            break
                            
            trace_keys_to_try = [entity_id]
            if unique_id:
                trace_keys_to_try.append(f"automation.{unique_id}")
                
            trace_path = hass.config.path(".storage/trace.saved_traces")
            if not os.path.exists(trace_path):
                return {"error": "No trace file found."}
                
            with open(trace_path, "r", encoding="utf-8") as f:
                trace_data = json.load(f)
                
            saved_traces = trace_data.get("data", {})
            matching_traces = None
            for key in trace_keys_to_try:
                if key in saved_traces:
                    matching_traces = saved_traces[key]
                    break
                    
            if not matching_traces:
                return {"error": f"No traces found for {entity_id}. Ensure it has run at least once."}
                
            # Parse the latest trace to make it readable for LLM
            latest_trace_raw = matching_traces[0]
            ext_dict = latest_trace_raw.get("extended_dict", {})
            
            summary = {
                "timestamp": ext_dict.get("timestamp"),
                "state": ext_dict.get("state"),
                "script_execution": ext_dict.get("script_execution"),
                "last_step": ext_dict.get("last_step"),
                "trace_path": []
            }
            
            raw_trace_steps = ext_dict.get("trace", {})
            for step_key, step_list in raw_trace_steps.items():
                for step in step_list:
                    step_info = {
                        "path": step.get("path"),
                        "result": step.get("result", {})
                    }
                    if "error" in step:
                        step_info["error"] = step["error"]
                    summary["trace_path"].append(step_info)
                    
            return {"success": True, "latest_trace": summary}
        except Exception as e:
            _LOGGER.error("COWORK: Error in GetAutomationTraceTool: %s", e)
            return {"error": str(e)}
