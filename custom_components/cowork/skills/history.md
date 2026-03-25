# Skill: History and Graphs
This skill allows you to display historical data visually.

## Rules
1. To show a graph of history for a sensor or device, use the 'sensor' card with a line graph:
```json
[
  {"type": "sensor", "entity": "sensor.temp", "graph": "line", "hours_to_show": 24}
]
```
2. For long-term data (like weeks or months), calculate the number of hours (e.g., 1 week = 168 hours) and use the `hours_to_show` property. Do NOT use `history-graph` or `statistics-graph`.
3. You MUST use a JSON block containing a JSON ARRAY of card configurations: `[...]`.
4. If asked for multiple sensors, output an array of multiple sensor cards.
5. Before answering questions about the past, ALWAYS use the `cowork_get_history` tool to see the actual data points.