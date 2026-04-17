import { planPacking } from "./packing";
import type { PackingContext } from "./types";

interface WorkerRequest {
  id: string;
  type: "plan-packing";
  payload: {
    context: PackingContext;
    items: {
      fileToken: string;
      fileName: string;
      size: number;
      mimeType?: string;
      parentId: string | null;
    }[];
  };
}

interface WorkerResponse {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  const response: WorkerResponse = {
    id: request.id,
    success: true,
  };

  try {
    switch (request.type) {
      case "plan-packing":
        response.result = planPacking(
          request.payload.context,
          request.payload.items,
        );
        break;
      default:
        throw new Error(`Unsupported drive manager worker request: ${request.type}`);
    }
  } catch (error) {
    response.success = false;
    response.error = error instanceof Error ? error.message : String(error);
  }

  self.postMessage(response);
};

export {};
