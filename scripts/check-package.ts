import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

type PackFile = { path: string; size: number }
type PackResult = { files: PackFile[] }

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  name: string
  version: string
  main?: string
  types?: string
  repository?: { url?: string; directory?: string }
  homepage?: string
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

const raw = execFileSync(
  'npm',
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  {
    encoding: 'utf8',
  },
)
const result = JSON.parse(raw) as PackResult[]
const files = result[0]?.files ?? []
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

console.log(
  `packed @aihu/scraping@${packageJson.version}: ${files.length} files`,
)
