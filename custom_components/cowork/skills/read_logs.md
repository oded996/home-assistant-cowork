# Skill: Diagnosing Issues with Logs
This skill allows you to read Home Assistant log files to diagnose errors, troubleshoot integrations, or investigate system issues.

## How to Read Logs
Use the `cowork_get_logs` tool to retrieve recent log entries.
- To get general recent logs, you can specify the number of `lines` to fetch (default is 50, up to a few hundred).
- If you are looking for a specific error or integration, provide a `grep_pattern` (e.g. `ERROR`, `cowork`, `zwave_js`) to filter the logs and only return relevant lines.

## Best Practices
1. **Always filter when possible:** Home Assistant logs can be very noisy. Use the `grep_pattern` parameter to narrow down the search to the specific component or error type the user is asking about.
2. **Increase lines for context:** If you find an error using a pattern but need more context, you can call the tool again without the pattern and increase the `lines` parameter to see what happened right before the error.
3. **Explain your findings:** Do not just dump the raw logs back to the user. Read the logs, identify the root cause of the issue (e.g. "It looks like your Z-Wave integration failed to connect"), and explain it in plain conversational English. You may include short snippets of the relevant log lines in a standard ````text` code block if it helps illustrate the problem.