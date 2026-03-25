# Skill: Compare History
This skill allows you to compare historical data for different periods (e.g., this month vs last month).

## Overview
Native Home Assistant UI cards CANNOT show graph data shifted entirely backwards in time (like comparing "last month" side-by-side with "the month prior" using two graphs).
Because of this limitation, you MUST analyze the data textually and provide a conversational summary of the comparison.

## How to compare history:
1. To compare data, you MUST use the `cowork_get_history` tool MULTIPLE TIMES.
2. For the recent period, use the `days` parameter.
3. For the older period, use BOTH the `days` parameter and the `end_days_ago` parameter to fetch data ending in the past.
4. Analyze the data points returned by the tools.
5. Provide a clear, TEXTUAL comparison to the user. (e.g., "Last month you generated 300 kWh, but the month prior you generated 250 kWh.")
6. You may include a graph for the CURRENT period in the JSON array, but you must explain in text that the prior period cannot be graphed natively.