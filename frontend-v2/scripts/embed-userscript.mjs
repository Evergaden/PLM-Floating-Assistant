import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..')
const bundlePath = path.join(repoRoot, 'frontend-v2', 'dist', 'plm-workbench-v2.iife.js')
const userscriptPath = path.join(repoRoot, 'outputs', 'plm-material-summary.user.js')
const startMarker = '/* <plm-frontend-v2-bundle> */'
const endMarker = '/* </plm-frontend-v2-bundle> */'
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const bundle = fs.readFileSync(bundlePath, 'utf8').trim()
if (!bundle.includes('PLMWorkbenchV2')) throw new Error('The frontend v2 host bundle did not expose PLMWorkbenchV2')

let source = fs.readFileSync(userscriptPath, 'utf8')
const markerPattern = new RegExp(`\\r?\\n${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\r?\\n?`, 'g')
source = source.replace(markerPattern, '\n')
source = source.replace(/\s*$/, '')
const output = `${source}\n\n${startMarker}\n${bundle}\n${endMarker}\n`
fs.writeFileSync(userscriptPath, output, 'utf8')

console.log(`Embedded frontend v2 host bundle (${bundle.length} bytes) into ${path.relative(repoRoot, userscriptPath)}`)
