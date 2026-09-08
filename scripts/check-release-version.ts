import { readFileSync } from 'node:fs'

const tag = process.argv[2] ?? process.env.RELEASE_TAG
if (!tag) {
  console.error('usage: bun run check:release-version v<package-version>')
  process.exit(1)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  name: string
  version: string
}
const expectedTag = `v${packageJson.version}`

if (tag !== expectedTag) {
  console.error(
    `release tag ${tag} must match ${packageJson.name}@${packageJson.version} (${expectedTag})`,
  )
  process.exit(1)
}

console.log(
  `release tag ${tag} matches ${packageJson.name}@${packageJson.version}`,
)
