import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';
import { BillDocument, type BillItem } from './BillDocument';

let logoDataUri: string | null = null;

// Read from src/lib/pdf/assets, NOT public/ — Next's serverless output file
// tracing deliberately excludes public/ (it's shipped to the platform's static
// CDN, served separately, not bundled into a route's function), so reading it
// via fs here would 500 in production despite working fine locally. The fonts
// next to this file rely on the same src/-relative guarantee (see fonts.ts).
function getLogoDataUri(): string {
  if (!logoDataUri) {
    const buffer = readFileSync(path.join(process.cwd(), 'src/lib/pdf/assets/app_logo.png'));
    logoDataUri = `data:image/png;base64,${buffer.toString('base64')}`;
  }
  return logoDataUri;
}

export interface RenderBillPdfInput {
  orderId: string;
  createdAt: string;
  guestName: string | null;
  guestPhone: string | null;
  guestAddress: string | null;
  items: BillItem[];
  discountTotal: number;
  total: number;
}

/** Renders the branded bill PDF for one order to a Buffer, ready to serve or attach. */
export function renderBillPdf(input: RenderBillPdfInput): Promise<Buffer> {
  return renderToBuffer(<BillDocument {...input} logoDataUri={getLogoDataUri()} />);
}
