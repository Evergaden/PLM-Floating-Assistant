# Pinyin conversion for trace names

`pinyin-pro-3.29.4.js` is the unmodified UMD distribution from pinyin-pro 3.29.4.
Its MIT license is preserved in `pinyin-pro-LICENSE.txt`.

Source: https://registry.npmjs.org/pinyin-pro/-/pinyin-pro-3.29.4.tgz
Documentation: https://pinyin-pro.cn/use/pinyin.html

`scripts/build-userscript.js trace-name-pinyin` embeds the library in a private
CommonJS wrapper. Converting a creator's name requires no network requests and
does not publish a library global on the PLM page.

Name conversion uses first letters without tones and `surname: 'head'` to handle
common polyphonic surnames. Both image and Excel traces use the same helper.
