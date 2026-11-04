/** Lightweight owner-authenticated Postgres Changes listener. No new package,
 * public endpoint or service-role credential is used. Database RLS still governs
 * which rows Supabase Realtime can send to the authenticated owner. */
export const OWNER_REALTIME_TABLES = Object.freeze([
  "command_center_project_work_units",
  "command_center_project_roadmaps",
  "command_center_project_checkpoints",
  "command_center_project_profiles",
  "analytics_metric_history",
  "metrics",
  "source_checkpoints",
  "cc7_analytics_kpis"
] as const);

const TOPIC = "realtime:command-center-owner";
const JOIN_REF = "1";

function packet(topic: string, event: string, payload: unknown, ref: string, joinRef: string | null = JOIN_REF): string {
  return JSON.stringify({ topic, event, payload, ref, join_ref: joinRef });
}

export function ownerRealtimeJoin(token: string): string {
  if (!token.trim()) throw new Error("Owner realtime requires an authenticated token");
  return packet(TOPIC, "phx_join", {
    config: {
      private: false,
      broadcast: { ack: false, self: false },
      presence: { enabled: false },
      postgres_changes: OWNER_REALTIME_TABLES.map((table) => ({ event: "*", schema: "public", table }))
    },
    access_token: token
  }, JOIN_REF);
}

export interface OwnerRealtimeOptions {
  readonly supabaseUrl: string;
  readonly publishableKey: string;
  readonly accessToken: () => Promise<string | undefined>;
  readonly onChanged: () => void;
}

/** A closing WebSocket never silently means a successful realtime connection.
 * Reconnects re-read full canonical state to cover events missed while offline.
 * The caller also maintains a bounded recovery refresh for incompatible clients. */
export function watchOwnerRealtime(options: OwnerRealtimeOptions): () => void {
  if (typeof WebSocket === "undefined") return () => {};
  const endpoint = new URL(options.supabaseUrl);
  if (endpoint.protocol !== "https:") throw new Error("Owner realtime requires HTTPS");
  endpoint.protocol = "wss:";
  endpoint.pathname = "/realtime/v1/websocket";
  endpoint.search = "";
  endpoint.searchParams.set("apikey", options.publishableKey);
  endpoint.searchParams.set("vsn", "1.0.0");

  let stopped = false;
  let socket: WebSocket | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let refreshAuth: ReturnType<typeof setInterval> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let delayMs = 1200;
  let sequence = 1;

  const clearTimers = (): void => {
    if (heartbeat) clearInterval(heartbeat);
    if (refreshAuth) clearInterval(refreshAuth);
    heartbeat = undefined;
    refreshAuth = undefined;
  };
  const send = (topic: string, event: string, payload: unknown, joinRef: string | null = JOIN_REF): void => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    sequence += 1;
    socket.send(packet(topic, event, payload, String(sequence), joinRef));
  };
  const connect = async (): Promise<void> => {
    if (stopped) return;
    const token = await options.accessToken().catch(() => undefined);
    if (stopped || !token) return;
    let currentToken = token;
    const nextSocket = new WebSocket(endpoint.toString());
    socket = nextSocket;
    let joined = false;

    nextSocket.onopen = () => {
      if (stopped) { nextSocket.close(); return; }
      nextSocket.send(ownerRealtimeJoin(token));
      heartbeat = setInterval(() => send("phoenix", "heartbeat", {}, null), 20_000);
      refreshAuth = setInterval(() => {
        void options.accessToken().then((fresh) => {
          if (stopped || nextSocket !== socket) return;
          if (!fresh) { nextSocket.close(); return; }
          if (fresh !== currentToken) {
            currentToken = fresh;
            send(TOPIC, "access_token", { access_token: fresh });
          }
        }).catch(() => nextSocket.close());
      }, 60_000);
    };
    nextSocket.onmessage = (event: MessageEvent<string>) => {
      let message: Record<string, unknown>;
      try {
        const raw: unknown = JSON.parse(event.data);
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
        message = raw as Record<string, unknown>;
      } catch { return; }
      if (message.event === "postgres_changes" && joined) {
        options.onChanged();
      } else if (message.event === "phx_reply" && message.ref === JOIN_REF) {
        const reply = message.payload;
        if (reply && typeof reply === "object" && !Array.isArray(reply)
            && (reply as Record<string, unknown>).status === "ok") {
          joined = true;
          delayMs = 1200;
          options.onChanged(); // recover records changed before channel joined
        } else {
          nextSocket.close();
        }
      }
    };
    nextSocket.onclose = () => {
      if (socket !== nextSocket) return;
      clearTimers();
      socket = undefined;
      if (stopped) return;
      retry = setTimeout(() => { void connect(); }, delayMs);
      delayMs = Math.min(30_000, delayMs * 2);
    };
    nextSocket.onerror = () => { nextSocket.close(); };
  };
  void connect();
  return () => {
    stopped = true;
    if (retry) clearTimeout(retry);
    clearTimers();
    const previous = socket;
    socket = undefined;
    if (previous) previous.close();
  };
}
