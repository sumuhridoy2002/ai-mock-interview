import Pusher from "pusher-js";
import { getToken } from "./auth";

const REVERB_KEY = process.env.NEXT_PUBLIC_REVERB_APP_KEY || "local-key";
const REVERB_HOST = process.env.NEXT_PUBLIC_REVERB_HOST || "localhost";
const REVERB_PORT = process.env.NEXT_PUBLIC_REVERB_PORT || "8080";
const REVERB_SCHEME = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
import { resolveBackendOrigin } from "./api-url";

export function createInterviewEcho(sessionUuid: string) {
  const token = getToken();

  return new Pusher(REVERB_KEY, {
    wsHost: REVERB_HOST,
    wsPort: parseInt(REVERB_PORT, 10),
    wssPort: parseInt(REVERB_PORT, 10),
    forceTLS: REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    cluster: "",
    authEndpoint: `${resolveBackendOrigin()}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });
}

export function subscribeToInterview(
  sessionUuid: string,
  handlers: {
    onQuestion?: (data: unknown) => void;
    onEvaluated?: (data: unknown) => void;
    onCompleted?: (data: unknown) => void;
  }
) {
  const pusher = createInterviewEcho(sessionUuid);
  const channel = pusher.subscribe(`private-interview.${sessionUuid}`);

  if (handlers.onQuestion) {
    channel.bind("question.generated", handlers.onQuestion);
  }
  if (handlers.onEvaluated) {
    channel.bind("answer.evaluated", handlers.onEvaluated);
  }
  if (handlers.onCompleted) {
    channel.bind("interview.completed", handlers.onCompleted);
  }

  return () => {
    channel.unbind_all();
    pusher.unsubscribe(`private-interview.${sessionUuid}`);
    pusher.disconnect();
  };
}
