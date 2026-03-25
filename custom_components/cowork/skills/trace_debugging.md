# Skill: Automation Trace Debugging
This skill allows you to debug and explain why an automation failed to run or behaved unexpectedly.

## How to debug an automation:
1. Always find the exact `entity_id` for the automation using the `cowork_search_entities` tool (if you don't already know it).
2. Use the `cowork_get_trace` tool with the `entity_id` to get the latest execution trace data from Home Assistant's internal storage.
3. The trace provides a timeline of steps (e.g., `action/0/if`, `action/0/then/0`) with timestamps.
4. Analyze the `result` field of each step. If a condition evaluates to `false`, that means the automation logic stopped there or took an `else` branch.
5. Explain the execution timeline to the user in plain, conversational English. Clearly state what triggered it, which conditions passed, and exactly where it stopped or failed.

## Displaying the Trace Visually
If the user asks to see the timeline or if it helps your explanation, you can display a `logbook` card which provides a visual timeline of the automation's execution.

Example format:
```json
[
  {"type": "logbook", "target": {"entity_id": ["automation.exact_alias_here"]}}
]
```