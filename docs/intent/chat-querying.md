# Chat Querying & Tool Calling Refactor

## Intent

- **Outcome:** Refactor the chat system to support natural language querying (e.g., "berapa pengeluaran hari ini?") using LLM tool/function calling, turning the bot into a two-way financial assistant.
- **User:** Individual users (starting with you and your girlfriend testing it independently).
- **Why now:** Core data entry is working; now the data needs to be useful and accessible via the same natural chat interface.
- **Success:** The user can ask for summaries or reports, the LLM correctly maps the intent to a predefined tool, fetches the data, and replies conversationally and accurately.
- **Constraint:** Must use structured, predefined function calls. No dynamic Text-to-SQL or raw database execution to prevent hallucinations.
- **Out of scope:** Shared wallets/split bills, and unbounded/dynamic database querying.
