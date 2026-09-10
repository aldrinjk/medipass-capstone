import { apiRequest } from '../../../services/apiClient';
import type {
  CreatePassRequest,
  CreatePassResponse,
  PassMetadata,
  RotatePassResponse,
} from '../../../types/pass';

/**
 * Calls the frozen /api/v1/passes contract (docs/api/openapi.yaml,
 * apps/api/.../pass/EmergencyPassController.java). Every authenticated
 * client call sends "Authorization: Bearer <access-token>" -- apiRequest
 * attaches that automatically and refreshes/redirects on a 401.
 */

export function createPass(request: CreatePassRequest): Promise<CreatePassResponse> {
  return apiRequest<CreatePassResponse>('/api/v1/passes', {
    method: 'POST',
    body: request,
  });
}

export function listPasses(): Promise<PassMetadata[]> {
  return apiRequest<PassMetadata[]>('/api/v1/passes');
}

export function getPass(passId: string): Promise<PassMetadata> {
  return apiRequest<PassMetadata>(`/api/v1/passes/${encodeURIComponent(passId)}`);
}

export function revokePass(passId: string): Promise<PassMetadata> {
  return apiRequest<PassMetadata>(`/api/v1/passes/${encodeURIComponent(passId)}/revoke`, {
    method: 'POST',
  });
}

export function rotatePass(passId: string): Promise<RotatePassResponse> {
  return apiRequest<RotatePassResponse>(`/api/v1/passes/${encodeURIComponent(passId)}/rotate`, {
    method: 'POST',
  });
}
