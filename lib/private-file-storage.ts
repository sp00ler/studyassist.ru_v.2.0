import path from 'path'

/** Private upload directory. Relative UPLOAD_DIR values resolve from the app root. */
export function getPrivateUploadRoot(): string {
  const configuredRoot = process.env.UPLOAD_DIR?.trim()
  if (configuredRoot?.includes('\0')) {
    throw new Error('UPLOAD_DIR must not contain NUL bytes')
  }

  const uploadRoot = path.resolve(configuredRoot || path.join(process.cwd(), 'private_uploads'))
  const publicRoot = path.resolve(process.cwd(), 'public')
  const relativeToPublic = path.relative(publicRoot, uploadRoot)
  if (relativeToPublic === '' || (relativeToPublic !== '..' && !relativeToPublic.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeToPublic))) {
    throw new Error('UPLOAD_DIR must be outside the public directory')
  }

  return uploadRoot
}

/** Resolve an untrusted relative upload path while keeping it under the private root. */
export function resolvePrivateUploadPath(relativePath: string): string | null {
  if (!relativePath || relativePath.includes('\0')) return null

  const portablePath = relativePath.replace(/\\/g, '/')
  if (path.posix.isAbsolute(portablePath) || path.win32.isAbsolute(relativePath)) return null

  const segments = portablePath.split('/')
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes(':'))) return null

  const root = getPrivateUploadRoot()
  const resolvedPath = path.resolve(root, ...segments)
  const relativeToRoot = path.relative(root, resolvedPath)

  if (!relativeToRoot || relativeToRoot === '..' || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
    return null
  }

  return resolvedPath
}
