// Standard PSD PackBits/RLE compression, lossless and compatible with PSD v1.
function canvasToFlatPsdBlob(canvas, dpi) {
  const width = canvas.width;
  const height = canvas.height;
  const resolution = Math.max(72, Math.round(Number(dpi) || 300));
  const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
  const header = new Uint8Array(68);
  const view = new DataView(header.buffer);
  const text = (offset, value) => {
    for (let i = 0; i < value.length; i++) header[offset + i] = value.charCodeAt(i);
  };
  text(0, '8BPS');
  view.setUint16(4, 1);
  view.setUint16(12, 3);
  view.setUint32(14, height);
  view.setUint32(18, width);
  view.setUint16(22, 8);
  view.setUint16(24, 3);
  view.setUint32(30, 28);
  text(34, '8BIM');
  view.setUint16(38, 1005);
  view.setUint32(42, 16);
  view.setUint32(46, resolution * 65536);
  view.setUint16(50, 1);
  view.setUint16(52, 1);
  view.setUint32(54, resolution * 65536);
  view.setUint16(58, 1);
  view.setUint16(60, 1);
  view.setUint16(66, 1); // RLE: row byte counts, then channel-major PackBits rows.
  const rowCounts = new Uint8Array(height * 3 * 2);
  const rowView = new DataView(rowCounts.buffer);
  const rows = [];
  const row = new Uint8Array(width);
  let compressedSize = rowCounts.length;
  for (let channel = 0; channel < 3; channel++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) row[x] = rgba[(y * width + x) * 4 + channel];
      // Worst case: one literal control byte per 128 source bytes.
      const packed = new Uint8Array(width + Math.ceil(width / 128));
      let x = 0, out = 0;
      while (x < width) {
        let run = 1;
        while (run < 128 && x + run < width && row[x + run] === row[x]) run++;
        if (run >= 3) {
          packed[out++] = 257 - run;
          packed[out++] = row[x];
          x += run;
        } else {
          const start = x;
          while (x < width && x - start < 128) {
            if (x + 2 < width && row[x] === row[x + 1] && row[x] === row[x + 2]) break;
            x++;
          }
          packed[out++] = x - start - 1;
          packed.set(row.subarray(start, x), out);
          out += x - start;
        }
      }
      if (out > 65535) throw new Error('PSD scanline exceeds the version 1 RLE limit');
      rowView.setUint16((channel * height + y) * 2, out);
      const bytes = packed.slice(0, out);
      rows.push(bytes);
      compressedSize += out;
    }
  }
  // Keep high-entropy images from becoming larger than an uncompressed PSD.
  if (compressedSize >= width * height * 3) {
    view.setUint16(66, 0);
    const planes = [];
    for (let channel = 0; channel < 3; channel++) {
      const plane = new Uint8Array(width * height);
      for (let i = 0; i < plane.length; i++) plane[i] = rgba[i * 4 + channel];
      planes.push(plane);
    }
    return new Blob([header, ...planes], { type: 'image/vnd.adobe.photoshop' });
  }
  return new Blob([header, rowCounts, ...rows], { type: 'image/vnd.adobe.photoshop' });
}
