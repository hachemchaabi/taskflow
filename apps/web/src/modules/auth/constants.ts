export const PROFILE_NAME_MIN = 1
export const PROFILE_NAME_MAX = 120

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MIME = ['image/png', 'image/jpeg', 'image/svg+xml']

export const PROFILE_MESSAGES = {
  saved: 'Profile updated.',
  saveError: 'Could not update your profile.',
  avatarError: 'Could not upload your photo.',
  avatarTypeError: 'Photo must be a PNG, JPG or SVG image.',
  avatarSizeError: 'Photo must be 2MB or smaller.',
} as const
