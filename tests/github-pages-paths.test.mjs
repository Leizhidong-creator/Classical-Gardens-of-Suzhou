import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import test from 'node:test'

const repositoryUrl = 'https://leizhidong-creator.github.io/Classical-Gardens-of-Suzhou/'

test('GitHub Pages uses the repository base path and portable asset URLs', () => {
  const viteConfig = readFileSync('vite.config.ts', 'utf8')
  const workflow = readFileSync('.github/workflows/static.yml', 'utf8')
  const readme = readFileSync('README.md', 'utf8')
  const indexHtml = readFileSync('index.html', 'utf8')
  const source = globSync('src/**/*.{ts,tsx}').map((path) => readFileSync(path, 'utf8')).join('\n')

  assert.match(viteConfig, /process\.env\.VITE_BASE_PATH \|\| '\/'/)
  assert.match(workflow, /VITE_BASE_PATH:\s*\/Classical-Gardens-of-Suzhou\//)
  assert.doesNotMatch(source, /["']\/assets\//)
  assert.match(indexHtml, /href="%BASE_URL%favicon\.svg"/)
  assert.match(readme, new RegExp(repositoryUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.doesNotMatch(readme, /tcloudbaseapp\.com|3d-garden\.leizhidong\.cn/)
})
