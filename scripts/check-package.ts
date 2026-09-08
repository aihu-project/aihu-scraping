import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

type PackFile = { path: string; size: number }
type PackResult = { filename?: string; files: PackFile[] }

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  name: string
  version: string
  main?: string
  types?: string
  repository?: { url?: string; directory?: string }
  homepage?: string
  module?: string
  exports?: Record<string, unknown>
}

if (packageJson.name !== '@aihu/scraping')
  throw new Error(`unexpected package name: ${packageJson.name}`)
if (packageJson.main !== './dist/index.js')
  throw new Error('main must point to ./dist/index.js')
if (packageJson.types !== './dist/index.d.ts')
  throw new Error('types must point to ./dist/index.d.ts')
if (
  packageJson.repository?.url !==
  'git+https://github.com/aihu-project/aihu-scraping.git'
) {
  throw new Error(
    'repository.url must point to the standalone GitHub repository',
  )
}
if (packageJson.repository && 'directory' in packageJson.repository) {
  throw new Error(
    'standalone package metadata must not retain a monorepo directory',
  )
}
if (
  packageJson.homepage !==
  'https://github.com/aihu-project/aihu-scraping#readme'
) {
  throw new Error('homepage must point to the standalone GitHub repository')
}

const packDir = mkdtempSync(join(tmpdir(), 'aihu-scraping-pack-'))
try {
  const raw = execFileSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', packDir],
    { encoding: 'utf8' },
  )
  const result = JSON.parse(raw) as PackResult[]
  const files = result[0]?.files ?? []
  const tarball = result[0]?.filename
  if (!tarball) throw new Error('npm pack did not report a tarball filename')

  const paths = new Set(files.map((file) => file.path))
  const required = ['LICENSE', 'README.md', 'dist/index.js', 'dist/index.d.ts']
  for (const path of required) {
    if (!paths.has(path)) throw new Error(`packed artifact is missing ${path}`)
  }
  const forbidden = files.filter(
    ({ path }) =>
      path.startsWith('src/') ||
      path.startsWith('tests/') ||
      path.startsWith('scripts/'),
  )
  if (forbidden.length) {
    throw new Error(
      `packed artifact contains development files: ${forbidden.map((file) => file.path).join(', ')}`,
    )
  }
  if (
    files.some(
      ({ path }) => path.includes('package-lock.json') || path === 'bun.lock',
    )
  ) {
    throw new Error('packed artifact contains a lockfile')
  }

  const packedManifest = JSON.parse(
    execFileSync(
      'tar',
      ['-xOf', join(packDir, tarball), 'package/package.json'],
      {
        encoding: 'utf8',
      },
    ),
  ) as typeof packageJson
  if (packedManifest.name !== packageJson.name) {
    throw new Error(
      `packed manifest changed package name to ${packedManifest.name}`,
    )
  }
  if (packedManifest.version !== packageJson.version) {
    throw new Error(
      `packed manifest changed version to ${packedManifest.version} (expected ${packageJson.version})`,
    )
  }
  if (JSON.stringify(packedManifest).includes('workspace:')) {
    throw new Error('packed manifest contains a workspace dependency')
  }
  const exportTargets: string[] = []
  const collectExportTargets = (value: unknown): void => {
    if (typeof value === 'string') exportTargets.push(value)
    else if (Array.isArray(value)) value.forEach(collectExportTargets)
    else if (value && typeof value === 'object') {
      Object.values(value).forEach(collectExportTargets)
    }
  }
  collectExportTargets(packedManifest.exports)
  for (const target of [
    packedManifest.main,
    packedManifest.module,
    packedManifest.types,
    ...exportTargets,
  ]) {
    if (target && !target.startsWith('./dist/')) {
      throw new Error(`packed manifest points outside dist: ${target}`)
    }
  }

  console.log(
    `packed @aihu/scraping@${packageJson.version}: ${files.length} files; manifest identity verified`,
  )
} finally {
  rmSync(packDir, { recursive: true, force: true })
}
