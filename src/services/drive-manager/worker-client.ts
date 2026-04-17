import type { PackingContext, UploadPlan } from "./types";

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

let driveManagerWorker: Worker | null = null;
const pending = new Map<
  string,
  { resolve: (result: unknown) => void; reject: (reason?: unknown) => void }
>();

function getWorker() {
  if (driveManagerWorker) {
    return driveManagerWorker;
  }
  driveManagerWorker = new Worker(new URL("./drive-manager.worker.ts", import.meta.url), {
    type: "module",
  });
  driveManagerWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const resolver = pending.get(response.id);
    if (!resolver) {
      return;
    }
    pending.delete(response.id);
    if (response.success) {
      resolver.resolve(response.result);
      return;
    }
    resolver.reject(new Error(response.error || "Drive manager worker failed"));
  };
  return driveManagerWorker;
}

function runWorkerRequest(request: WorkerRequest) {
  return new Promise<unknown>((resolve, reject) => {
    pending.set(request.id, { resolve, reject });
    getWorker().postMessage(request);
  });
}

export async function planPackingInWorker(
  context: PackingContext,
  items: WorkerRequest["payload"]["items"],
): Promise<UploadPlan> {
  const id = crypto.randomUUID();
  const result = await runWorkerRequest({
    id,
    type: "plan-packing",
    payload: {
      context,
      items,
    },
  });
  return result as UploadPlan;
}
