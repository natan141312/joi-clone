# Companion backend (characters, chat, voice, pictures)

Modeled on the text-generation-webui setup: a local LLM plus a character card, ElevenLabs TTS,
Whisper STT, a multimodal model for incoming pictures, and Stable Diffusion for outgoing pictures.

| Feature | Video (text-generation-webui) | This app |
|---|---|---|
| Model | Local LLM (GGUF/AWQ) | Any OpenAI-compatible server (`LLM_BASE_URL`); mock if unset |
| Character | Parameters > Character | `/generate/character`, `src/lib/companion/types.ts` |
| Prompt | name, persona, scenario, example dialogue, greeting, {{user}} | `src/lib/companion/prompt.ts` |
| Generation params | Parameters tab | per character: temperature, top_p, max tokens |
| Voice out | elevenlabs_tts extension | `POST /api/tts` (auto-plays in chat) |
| Voice in | whisper_stt extension | mic button -> `POST /api/stt` -> sent as message |
| Send picture | multimodal extension | attach button; sent as image_url when `LLM_VISION=true` |
| Receive picture | sd_api_pictures extension | sparkle button -> `POST /api/chats/:id/image` (A1111 API) |

## Run locally
1. `cp .env.example .env.local`, fill what you have (everything is optional).
2. e.g. text-generation-webui started with `--api` -> `LLM_BASE_URL=http://127.0.0.1:5000/v1`
3. `npm run dev` -> http://localhost:3000

## API
- `GET/POST /api/characters`, `GET/PATCH/DELETE /api/characters/:id`
- `GET/POST /api/chats`, `GET /api/chats/:id`
- `POST /api/chats/:id/messages` `{text, image?}` -> streamed text/plain
- `POST /api/chats/:id/image` `{prompt?}`, `POST /api/tts`, `POST /api/stt`, `GET /api/status`
- `GET /chat/start/:characterId` -> new chat + redirect

## Rules enforced server-side
Characters must be 18+ and confirmed fictional (not a real person); SD negative prompt excludes minors;
ids are validated (no path traversal); input sizes are capped.

## Not included
Auth/accounts, payments, moderation pipeline, database (JSON files in ./data), video calls.
