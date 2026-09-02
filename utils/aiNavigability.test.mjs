import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const login = readFileSync(new URL('../pages/login.vue', import.meta.url), 'utf8')
const history = readFileSync(new URL('../components/ConversationsList.vue', import.meta.url), 'utf8')
const navbar = readFileSync(new URL('../components/CustomerNavbar.vue', import.meta.url), 'utf8')

for (const required of [
  `:aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"`,
  `:aria-pressed="showPassword"`,
  `aria-controls="password"`,
  `aria-label="Cerrar error"`,
]) assert.ok(login.includes(required), `missing login semantic: ${required}`)

assert.match(history, /<button[\s\S]*Abrir conversación:/)
assert.match(history, /:aria-current="activeId === c\.id \? 'page' : undefined"/)
assert.match(history, /<button[\s\S]*Eliminar conversación:/)
assert.doesNotMatch(history, /v-for="c in conversations"[\s\S]{0,120}@click="\$emit\('open'/)
assert.match(history, /\.slice\(0, 80\)/)

assert.match(navbar, /<MenuButton[\s\S]*?aria-label="Abrir menú de cuenta"/)
const desktopLogout = navbar.match(/<MenuItem v-slot="\{ active \}">\s*<button[\s\S]*?aria-label="Cerrar sesión"[\s\S]*?<\/button>\s*<\/MenuItem>/)
assert.ok(desktopLogout, 'desktop logout must be one native named button inside MenuItem')
assert.match(desktopLogout[0], /type="button"/)
assert.equal((desktopLogout[0].match(/@click="handleLogout"/g) || []).length, 1)
assert.doesNotMatch(desktopLogout[0], /<a\b|href=/)
assert.match(navbar, /useState\("user"\)\.value = null/)

console.log('PASS — P0 AI navigability source contract')
