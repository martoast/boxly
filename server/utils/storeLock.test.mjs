// Pure tests for server/utils/storeLock.ts — is the whole store closed (password page / waiting room)?
import { lockFromPage, openingLine } from './storeLock.ts'

let passed = 0, failed = 0
const check = (name, ok, detail = '') => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} ${detail}`) } }
const P = 'https://www.youngla.com/products/6006'

check('Shopify password redirect is a lock', lockFromPage(302, 'https://www.youngla.com/password', P)?.kind === 'password')
check('relative /password too', lockFromPage(302, '/password', P)?.kind === 'password')
check('queue-it waiting room is a lock', lockFromPage(302, 'https://boxly.queue-it.net/?c=x', P)?.kind === 'queue')
check('an ordinary redirect is not', lockFromPage(301, 'https://www.youngla.com/products/6006-cargo', P) === null)
check('a normal page is not', lockFromPage(200, null, P) === null)
check('a /password-reset page is not', lockFromPage(302, '/account/password-reset', P) === null)

const youngla = `<div>Enter password below to access the store:</div><h2>Opening soon</h2>
<p>The site will open at 12:00 PM PST for the September 24th Launch!</p><label>E-mail</label>`
check('reads the opening line', openingLine(youngla) === 'The site will open at 12:00 PM PST for the September 24th Launch!', openingLine(youngla))
check('Spanish too', openingLine('<p>La tienda abre el lunes a las 9 AM</p>') === 'La tienda abre el lunes a las 9 AM')
check('no line → null', openingLine('<p>Enter password</p>') === null)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
