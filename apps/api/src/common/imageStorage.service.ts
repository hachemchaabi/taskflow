import { Dropbox } from 'dropbox'
import { env } from '../config/env.js'
import { HttpError } from './errorHandler.js'

export interface UploadedFile {
  buffer: Buffer
  mimetype: string
}

export interface ImageStorage {
  upload(dir: string, key: string, file: UploadedFile): Promise<string>
  remove(dir: string, key: string): Promise<void>
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
}

function getClient(): Dropbox {
  const { appKey, appSecret, refreshToken } = env.dropbox
  if (!appKey || !appSecret || !refreshToken) {
    throw new HttpError(
      503,
      'Image storage is not configured. Set DROPBOX_APP_KEY, DROPBOX_APP_SECRET and DROPBOX_REFRESH_TOKEN.',
    )
  }
  return new Dropbox({ clientId: appKey, clientSecret: appSecret, refreshToken })
}

function toRawUrl(url: string): string {
  const direct = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
  if (direct.includes('dl=0')) return direct.replace('dl=0', 'raw=1')
  return `${direct}${direct.includes('?') ? '&' : '?'}raw=1`
}

async function deleteVariants(dbx: Dropbox, dir: string, key: string): Promise<void> {
  await Promise.allSettled(
    Object.values(EXT_BY_MIME).map((ext) => dbx.filesDeleteV2({ path: `${dir}/${key}.${ext}` })),
  )
}

async function sharedUrl(dbx: Dropbox, path: string): Promise<string> {
  try {
    const res = await dbx.sharingCreateSharedLinkWithSettings({ path })
    return res.result.url
  } catch {
    const existing = await dbx.sharingListSharedLinks({ path, direct_only: true })
    const link = existing.result.links[0]
    if (!link) throw new HttpError(502, 'Could not create a shared link for the image')
    return link.url
  }
}

export const imageStorage: ImageStorage = {
  async upload(dir, key, file) {
    const ext = EXT_BY_MIME[file.mimetype]
    if (!ext) throw new HttpError(415, 'Unsupported image type')
    const dbx = getClient()
    const path = `${dir}/${key}.${ext}`
    try {
      await deleteVariants(dbx, dir, key)
      await dbx.filesUpload({ path, contents: file.buffer, mode: { '.tag': 'overwrite' } })
      return toRawUrl(await sharedUrl(dbx, path))
    } catch (err) {
      if (err instanceof HttpError) throw err
      throw new HttpError(502, 'Could not store the image with Dropbox')
    }
  },

  async remove(dir, key) {
    const dbx = getClient()
    try {
      await deleteVariants(dbx, dir, key)
    } catch (err) {
      if (err instanceof HttpError) throw err
      throw new HttpError(502, 'Could not remove the image from Dropbox')
    }
  },
}
