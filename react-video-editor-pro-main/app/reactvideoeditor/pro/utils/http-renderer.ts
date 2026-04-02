import { VideoRenderer, RenderParams, RenderResponse, ProgressParams, ProgressResponse, RenderTypeInfo } from "../types/renderer";

/**
 * HTTP-based video renderer implementation
 */
export class HttpRenderer implements VideoRenderer {
  private endpoint: string;
  private renderTypeInfo: RenderTypeInfo;

  constructor(endpoint: string, renderType: RenderTypeInfo) {
    this.endpoint = endpoint;
    this.renderTypeInfo = renderType;
  }

  async renderVideo(params: RenderParams): Promise<RenderResponse> {
    const response = await fetch(`${this.endpoint}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        (responseData as { error?: string; details?: string }).error ||
        (responseData as { error?: string; details?: string }).details ||
        JSON.stringify(responseData);
      throw new Error(
        `Render request failed (${response.status}): ${detail || response.statusText}`
      );
    }
    
    // Handle different response structures
    // Lambda renderer wraps response in { type: "success", data: ... }
    // SSR renderer returns response directly
    if (responseData.type === "success" && responseData.data) {
      return responseData.data;
    }
    
    // Direct response (SSR)
    return responseData as RenderResponse;
  }

  async getProgress(params: ProgressParams): Promise<ProgressResponse> {
    const response = await fetch(`${this.endpoint}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        (responseData as { error?: string; details?: string }).error ||
        (responseData as { error?: string; details?: string }).details ||
        JSON.stringify(responseData);
      throw new Error(
        `Progress request failed (${response.status}): ${detail || response.statusText}`
      );
    }
    
    // Handle different response structures
    // Lambda renderer wraps response in { type: "success", data: ... }
    // SSR renderer returns response directly
    if (responseData.type === "success" && responseData.data) {
      return responseData.data;
    }
    
    // Direct response (SSR)
    return responseData as ProgressResponse;
  }

  get renderType(): RenderTypeInfo {
    return this.renderTypeInfo;
  }
} 