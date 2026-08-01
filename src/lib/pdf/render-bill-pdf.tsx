import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';
import { BillDocument, type BillItem } from './BillDocument';

let logoDataUri: string | null = null;

function getLogoDataUri(): string {
  if (!logoDataUri) {
    const buffer = readFileSync(path.join(process.cwd(), 'public/assets/images/app_logo.png'));
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
