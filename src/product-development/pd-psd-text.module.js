  // Adobe PSD layer records contain text metadata before any channel pixels.
  async function productDevelopmentReadPsdText(file) {
    const fail = () => { throw new Error('PSD 图层数据不完整或格式不受支持'); };
    const utf16 = new TextDecoder('utf-16be');
    const legacyName = new TextDecoder('macintosh');
    let buffer;
    let bufferStart = -1;
    async function read(offset, length, end = file.size) {
      if (offset < 0 || length < 0 || offset + length > end || end > file.size) fail();
      if (!buffer || offset < bufferStart || offset + length > bufferStart + buffer.byteLength) {
        bufferStart = offset;
        buffer = await file.slice(offset, Math.min(file.size, offset + Math.max(length, 65536))).arrayBuffer();
      }
      return new DataView(buffer, offset - bufferStart, length);
    }
    function bytes(view, offset, length) {
      if (offset + length > view.byteLength) fail();
      return new Uint8Array(view.buffer, view.byteOffset + offset, length);
    }
    const key = (view, offset) => String.fromCharCode(...bytes(view, offset, 4));
    const lengthAt = async (offset, end) => (await read(offset, 4, end)).getUint32(0);
    const unicode = (view, offset) => utf16.decode(bytes(view, offset + 4, view.getUint32(offset) * 2)).replace(/\0+$/, '');
    function readTypeText(view) {
      if (view.getUint16(0) !== 1 || view.getUint16(50) !== 50 || view.getUint32(52) !== 16) fail();
      const afterString = (offset) => offset + 4 + view.getUint32(offset) * 2;
      const afterId = (offset) => offset + 4 + (view.getUint32(offset) || 4);
      // Read the descriptor entry by name, skipping typed values before it.
      function descriptor(offset, depth, findText) {
        if (depth > 12) fail();
        offset = afterId(afterString(offset));
        const count = view.getUint32(offset);
        offset += 4;
        if (count > 10000) fail();
        for (let i = 0; i < count; i++) {
          const valueOffset = afterId(offset);
          const isText = findText && valueOffset - offset === 8 && key(view, offset + 4) === 'Txt ';
          if (isText && key(view, valueOffset) === 'TEXT') return unicode(view, valueOffset + 4);
          offset = skipValue(valueOffset, depth);
        }
        return offset;
      }
      function skipValue(offset, depth) {
        const type = key(view, offset);
        offset += 4;
        if (depth > 12) fail();
        switch (type) {
          case 'TEXT': return afterString(offset);
          case 'enum': return afterId(afterId(offset));
          case 'long': return offset + 4;
          case 'doub':
          case 'comp': return offset + 8;
          case 'UntF': return offset + 12;
          case 'UnFl': return offset + 8;
          case 'bool': return offset + 1;
          case 'alis':
          case 'tdta': return offset + 4 + view.getUint32(offset);
          case 'GlbO':
          case 'Objc': return descriptor(offset, depth + 1, false);
          case 'VlLs': {
            const count = view.getUint32(offset);
            offset += 4;
            if (count > 10000) fail();
            for (let i = 0; i < count; i++) offset = skipValue(offset, depth + 1);
            return offset;
          }
          default: return fail();
        }
      }
      const result = descriptor(56, 0, true);
      if (typeof result !== 'string') fail();
      return result.replace(/\r\n?|\u0003/g, '\n').trim();
    }

    const header = await read(0, 26);
    if (key(header, 0) !== '8BPS' || header.getUint16(4) !== 1) throw new Error('请选择 Photoshop PSD 文件（.psd）');
    const depth = header.getUint16(22);
    let offset = 26;
    for (let section = 0; section < 2; section++) offset += 4 + await lengthAt(offset);
    const layerMaskSize = await lengthAt(offset);
    offset += 4;
    const layerMaskEnd = offset + layerMaskSize;
    if (layerMaskEnd > file.size) fail();

    let infoSize = layerMaskSize ? await lengthAt(offset, layerMaskEnd) : 0;
    let infoOffset = offset + 4;
    if (infoOffset + infoSize > layerMaskEnd && layerMaskSize) fail();
    if (layerMaskSize && (depth === 16 || depth === 32)) {
      offset = infoOffset + infoSize;
      offset += 4 + await lengthAt(offset, layerMaskEnd);
      if (offset > layerMaskEnd) fail();
      while (offset + 12 <= layerMaskEnd) {
        const block = await read(offset, 12, layerMaskEnd);
        const size = block.getUint32(8);
        const tag = key(block, 4);
        if (key(block, 0) !== '8BIM' || offset + 12 + size > layerMaskEnd) fail();
        if (tag === (depth === 16 ? 'Lr16' : 'Lr32')) {
          infoOffset = offset + 12;
          infoSize = size;
          break;
        }
        offset += 12 + Math.ceil(size / 4) * 4;
      }
    }

    const records = [];
    const infoEnd = infoOffset + infoSize;
    if (infoSize) {
      const count = Math.abs((await read(infoOffset, 2, infoEnd)).getInt16(0));
      offset = infoOffset + 2;
      for (let i = 0; i < count; i++) {
        const record = await read(offset, 18, infoEnd);
        const bounds = { top: record.getInt32(0), left: record.getInt32(4), bottom: record.getInt32(8), right: record.getInt32(12) };
        const channels = record.getUint16(16);
        offset += 18 + channels * 6;
        const blend = await read(offset, 16, infoEnd);
        if (key(blend, 0) !== '8BIM') fail();
        const layer = { name: '', bounds, divider: 0, visible: !(blend.getUint8(10) & 2), smart: false, unreadable: false };
        offset += 16;
        const extraEnd = offset + blend.getUint32(12);
        if (extraEnd > infoEnd) fail();
        for (let section = 0; section < 2; section++) offset += 4 + await lengthAt(offset, extraEnd);
        const nameLength = (await read(offset, 1, extraEnd)).getUint8(0);
        const name = await read(offset + 1, nameLength, extraEnd);
        layer.name = legacyName.decode(bytes(name, 0, nameLength));
        offset += Math.ceil((nameLength + 1) / 4) * 4;
        if (offset > extraEnd) fail();
        while (offset + 12 <= extraEnd) {
          let block = await read(offset, 12, extraEnd);
          // Photoshop writers may add an even-byte pad after an odd-sized tag.
          if (key(block, 0) !== '8BIM' && key(block, 0) !== '8B64' && block.getUint8(0) === 0) {
            offset++;
            block = await read(offset, 12, extraEnd);
          }
          if (key(block, 0) !== '8BIM' && key(block, 0) !== '8B64') fail();
          const tag = key(block, 4);
          const size = block.getUint32(8);
          offset += 12;
          const blockEnd = offset + size;
          if (blockEnd > extraEnd) fail();
          if (tag === 'luni' && size >= 4 && size <= 65536) layer.name = unicode(await read(offset, size, blockEnd), 0);
          if (tag === 'lsct' || tag === 'lsdk') layer.divider = await lengthAt(offset, blockEnd);
          if (tag === 'SoLd' || tag === 'SoLE' || tag === 'PlLd' || tag === 'plLd') layer.smart = true;
          if (tag === 'TySh' || tag === 'tySh') {
            try {
              if (tag !== 'TySh' || size > 4 * 1024 * 1024) fail();
              layer.text = readTypeText(await read(offset, size, blockEnd));
            } catch {
              layer.unreadable = true;
            }
          }
          offset = blockEnd;
        }
        offset = extraEnd;
        records.push(layer);
      }
    }

    const groups = [];
    const layers = [];
    let hiddenCount = 0;
    let unreadableCount = 0;
    let smartCount = 0;
    for (const layer of records.reverse()) {
      if (layer.divider === 3) {
        groups.pop();
        continue;
      }
      const parent = groups[groups.length - 1];
      const visible = layer.visible && (!parent || parent.visible);
      const path = parent ? parent.path + ' / ' + layer.name : layer.name;
      if (layer.divider === 1 || layer.divider === 2) groups.push({ visible, path });
      if (layer.smart && visible) smartCount++;
      if (!visible && (layer.text || layer.unreadable)) hiddenCount++;
      else if (layer.unreadable) unreadableCount++;
      else if (layer.text) layers.push({ name: path, text: layer.text, bounds: layer.bounds });
    }
    return { layers, hiddenCount, unreadableCount, smartCount };
  }
