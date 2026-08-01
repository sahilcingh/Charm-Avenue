import path from 'node:path';
import { Font } from '@react-pdf/renderer';

let registered = false;

/**
 * The standard PDF fonts (Helvetica etc.) use WinAnsi encoding, which has no
 * ₹ glyph — it silently renders blank. Noto Sans is bundled locally (rather
 * than fetched from Google Fonts at render time) so bill generation doesn't
 * depend on outbound network access, and registered once per server process.
 */
export function registerBillFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Noto Sans',
    fonts: [
      {
        src: path.join(process.cwd(), 'src/lib/pdf/fonts/NotoSans-Regular.ttf'),
        fontWeight: 'normal',
      },
      { src: path.join(process.cwd(), 'src/lib/pdf/fonts/NotoSans-Bold.ttf'), fontWeight: 'bold' },
    ],
  });
}
