# Multiplayer

Duel is two players locking a tiny move every few seconds, then revealing together. Latency does not matter. **Not leaking the other pick until both have locked does.** That is why this is a small relay, not a P2P pipe.

**Trying first: Cloudflare Durable Objects.** Same source locally via `wrangler dev` and in production via `wrangler deploy`.

## What we are building

Not only a room code. A shared **available** list:

1. Type a display name, join the list.
2. Click someone. They get a challenge.
3. They accept. Both leave the list and enter a match.
4. Each turn, each client sends a move. The other client does **not** see it. When both have locked (or the clock defaults to Parry), both get `{ you, them }`.

Room codes can still exist as a side door. The list is the default. A global “play anyone” queue is a later problem; a niche fighter’s queue is empty most of the time.

## Why not WebRTC / “full frontend”

Browsers have no raw sockets. The only browser P2P pipe is a WebRTC DataChannel. That still needs a signaling handshake (offer / answer / ICE), plus **STUN** (hole punching) and **TURN** for the ~10–20% of NATs that cannot punch. Game traffic can skip your server after connect; handshake and failed-NAT traffic cannot.

Libraries that get close to `joinRoom({ appId }, roomId)`:

| | What it is | Why not v1 |
|---|---|---|
| **Trystero** | Signaling on public Nostr / MQTT / BitTorrent, then WebRTC. Zero server of yours. | Third-party infra can flake. TURN still on you. Opponent’s browser sees your move unless you add commit-reveal. |
| **PeerJS** | `Peer` / `connect`, free hosted signaling + STUN. | Same NAT/TURN and leak issues. Hosted broker has been flaky. |

For simultaneous RPS, a DataChannel is the wrong default: the opponent *is* the other client. Hiding a pick needs commit-reveal (`hash(move+salt)` then reveal) or a trusted holder. A relay that **stores** the move and only broadcasts when both exist is simpler, and the extra hop is invisible at this cadence.

Reach for P2P later only if avoiding any long-lived server is a hard requirement, or if real-time mechanics come back and latency starts to matter.

## Browser transport (if we host the relay)

| | Fit |
|---|---|
| **Polling** | Works for 2 friends. Adds up to one interval of lag. Ugly for “someone challenged you.” |
| **SSE** | Push one way; you still POST the move. Two protocols for a bidirectional loop. |
| **WebSocket** | One socket, both directions. Default. |

## Where the relay lives

The server is not a dumb pipe. It holds each pick and only reveals when both are in (or timeout).

| Option | Local | Free tier | Fit |
|---|---|---|---|
| **Cloudflare Durable Objects** (first try) | `wrangler dev` — **same Worker/DO code** as prod (Miniflare). Not a second Node `ws` server. | Workers **Free**: 100k DO requests/day, 13k GB-s/day. Incoming WS messages billed 20:1. Hibernation sleeps the match object between turns. No $5 Paid plan needed at this scale. | Lobby = one named object. Match = one object, two sockets, moves in memory. Presence = socket still open. |
| **Firebase Realtime Database** | Emulator: `firebase emulators:start` + `connectDatabaseEmulator`. Same client + rules. Emulator UI defaults to port **4000** (our game port; remap it). | **Spark** $0, no card, hard cap: 100 concurrent, 10 GB down/month, 1 GB stored. Errors, does not bill. **Blaze** is pay-as-you-go (card); Cloud Functions are Blaze-only. | Lobby + `onDisconnect` presence are native. Buffering on Spark = security rules (turn node readable only when both children exist), not a function. More fiddly, easy to leak a path. |
| **Raspberry Pi** `ws` server | `node` on localhost, then the Pi. | $0 if you already run it. | Fine, small. You operate TLS, uptime, and a home link. No reason to pick this over Cloudflare unless you want that control. |
| **EC2** | SSH to a box. | Not free in any useful way. | Overkill. |
| **Pusher / Ably / MQTT cloud** | Vendor sandbox or local MQTT. | Freemium message caps. | “Relay JSON to a channel name.” We would still need somewhere that **holds** the move. |

A **plain** Cloudflare Worker is stateless. The lobby list and hidden moves need **Durable Objects** (SQLite backend is on the Free plan). PartyKit is sugar on DOs if we want less boilerplate later.

## Cloudflare shape

```
lobby DO (id: "lobby")
  players: { [id]: { name } }
  challenges: { from, to }

match DO (id: matchId)
  p1, p2 sockets
  locked[turn][player] = move    // never forwarded
  when both locked → reveal { turn, p1, p2 }
```

Client URL:

- local: `ws://localhost:8787`
- prod: `wss://<worker>.workers.dev`

Protocol (sketch):

```
join       { name }
lobby      { players[] }
challenge  { from, to }
accept     { from, to }          → both get { matchId, you: 'p1'|'p2' }
lock       { turn, move }        // stored, not forwarded
thinking   { turn, who }         // optional; no move payload
reveal     { turn, p1, p2 }
peer_left
```

Timeout default is **Parry** (safe option), not Heal.

### Local

```bash
npm run serve       # game at http://localhost:4000
npx wrangler dev     # API at :8787
```

Same files as `wrangler deploy`. Local DO storage stays in memory; restarting Wrangler wipes the lobby. Saving a file hot-reloads and **drops WebSockets**. Hibernation does not really evict locally; buffering still works.

### Split-screen local view

For local playtesting, a **two-player view in one tab**: each **horizontal half** of the screen is identical to what a full tab would show (own lobby name, own challenge UI, own fighter, own input). Not a special “hotseat” ruleset; two independent clients that happen to share a window.

How:

- **Two iframes** loading the same origin (simplest isolation: two JS heaps, two sockets, two Phaser games). Parent is a thin chrome: top / bottom (or left / right) frames, maybe a drag split.
- **Or one page, two mounts** if we keep Phaser instances and network sessions strictly separate. Same visual contract: half === a tab.

Open `/#local` or `/local` only in dev. Production stays one client per tab. Two real tabs (or one incognito) against `:4000` remains valid; split-screen is so you do not need that.

## Firebase buffering (if we switch)

Do not put the raw move on a path the opponent can read early.

- Public: `lobby/`, `challenges/`, `rooms/{id}/ready/p1|p2` (booleans only).
- Secret: `rooms/{id}/turns/{n}/p1` and `.../p2`.
- Rules: turn node **readable only when both children exist**; each player writes **their** slot once.

Subscribe to `ready`. When both are true, read the turn node. Until then a listener on that node is denied. Anonymous auth is enough. No Cloud Functions on Spark.

## Out of v1

- STUN/TURN, Trystero, PeerJS
- Server-authoritative combat resolve (clients can keep running the matrix; the relay only delivers two enums). Revisit if we ever ranked-match strangers who cheat the client.
- Global matchmaking queue
- Hosting the static game and the Worker as one thing (Pages + Worker is a later convenience)
