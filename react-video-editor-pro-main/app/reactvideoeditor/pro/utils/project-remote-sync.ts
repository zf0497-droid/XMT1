/**
 * 在本地 IndexedDB 保存成功后，将工程同步到你们自己的后端（经 Next 代理 /api/projects/save）。
 */

export interface RemoteProjectPayload {
  id: string;
  overlays: unknown[];
  aspect_ratio?: string;
  aspectRatio?: string;
  background_color?: string;
  backgroundColor?: string;
}

export async function syncProjectToRemote(
  payload: RemoteProjectPayload
): Promise<void> {
  const res = await fetch("/api/projects/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Remote save failed: ${res.status} ${res.statusText} ${text}`
    );
  }
}
