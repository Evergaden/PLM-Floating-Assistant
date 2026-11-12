# Pinyin conversion for trace names

`pinyin-pro-3.29.4.js` is the unmodified UMD distribution from pinyin-pro 3.29.4.
Its MIT license is preserved in `pinyin-pro-LICENSE.txt`.

Source: https://registry.npmjs.org/pinyin-pro/-/pinyin-pro-3.29.4.tgz
Documentation: https://pinyin-pro.cn/use/pinyin.html

Only the Cloudflare Worker imports this library, through `src/trace-name-initials.js`.
The userscript sends a name to the authenticated `/users/name-initials` endpoint
once, then keeps the returned initials in local persistent storage, keyed by name.
No dictionary or CDN pinyin dependency is included in the installable userscript.
Users can correct initials in export settings. A correction wins over a pending
cloud response. Failed conversion is not cached; exports retain the original name
until conversion succeeds or the user enters initials. No AI service is involved.

Name conversion uses first letters without tones and `surname: 'head'` to handle
common polyphonic surnames. Both image and Excel traces use the same helper.
