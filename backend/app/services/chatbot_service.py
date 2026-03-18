# WHO WRITES THIS: ML developer / Backend developer
# WHAT THIS DOES: Sends messages to Ollama LLM running locally.
#                 Uses a system prompt that instructs the LLM to collect
#                 student profile data conversationally.
#                 extract_profile() parses <profile>JSON</profile> from LLM output.
#                 When profile_complete=true in JSON, saves to StudentProfile.
# DEPENDS ON: httpx (async), config.py (OLLAMA_HOST, OLLAMA_MODEL)

import httpx

async def send_to_ollama(message: str, history: list) -> str:
    pass  # TODO: POST to ollama /api/chat, return response text

def extract_profile(llm_output: str) -> dict | None:
    pass  # TODO: parse <profile>...</profile> block from output