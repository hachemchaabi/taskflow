import { imageStorage, type UploadedFile } from '../../common/imageStorage.service.js'

const LOGO_DIR = '/workspace-logos'

export type { UploadedFile }

export interface LogoStorage {
  upload(workspaceId: string, file: UploadedFile): Promise<string>
  remove(workspaceId: string): Promise<void>
}

export const logoStorage: LogoStorage = {
  upload: (workspaceId, file) => imageStorage.upload(LOGO_DIR, workspaceId, file),
  remove: (workspaceId) => imageStorage.remove(LOGO_DIR, workspaceId),
}
