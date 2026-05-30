import { imageStorage, type UploadedFile } from '../../common/imageStorage.service.js'

const ICON_DIR = '/board-icons'

export type { UploadedFile }

export interface IconStorage {
  upload(boardId: string, file: UploadedFile): Promise<string>
  remove(boardId: string): Promise<void>
}

export const iconStorage: IconStorage = {
  upload: (boardId, file) => imageStorage.upload(ICON_DIR, boardId, file),
  remove: (boardId) => imageStorage.remove(ICON_DIR, boardId),
}
