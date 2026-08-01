import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { registerBillFonts } from './fonts';

registerBillFonts();

const COLORS = {
  bg: '#FBF1EF',
  roseDark: '#D1636F',
  text: '#1E1712',
  muted: '#9C6D74',
  border: '#EBD9D5',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Noto Sans',
    fontSize: 10,
    color: COLORS.text,
    padding: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 42, height: 42, objectFit: 'contain' },
  brandTextWrap: { marginLeft: 10 },
  brandName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  brandTagline: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  billTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.roseDark, textAlign: 'right' },
  billMeta: { fontSize: 9, color: COLORS.muted, textAlign: 'right', marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.border, marginVertical: 14 },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  billToBlock: { marginBottom: 6 },
  billToText: { fontSize: 10, color: COLORS.text, lineHeight: 1.5 },
  table: { marginTop: 10 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colAmount: { flex: 1.2, textAlign: 'right' },
  th: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemName: { fontSize: 10, color: COLORS.text, fontWeight: 'bold' },
  itemMeta: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  bodyValue: { fontSize: 10, color: COLORS.text },
  summaryWrap: { alignItems: 'flex-end', marginTop: 16 },
  summaryBox: { width: 220 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 10, color: COLORS.muted },
  summaryValue: { fontSize: 10, color: COLORS.text },
  discountValue: { fontSize: 10, color: COLORS.roseDark },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },
  totalValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.roseDark },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, alignItems: 'center' },
  footerThanks: { fontSize: 10, color: COLORS.roseDark, marginBottom: 6, fontWeight: 'bold' },
  footerContact: { fontSize: 8, color: COLORS.muted },
  footerNote: { fontSize: 7, color: COLORS.muted, marginTop: 6 },
});

export interface BillItem {
  name: string;
  variantLabel?: string | null;
  personalizationText?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface BillDocumentProps {
  orderId: string;
  createdAt: string;
  guestName?: string | null;
  guestPhone?: string | null;
  guestAddress?: string | null;
  items: BillItem[];
  discountTotal: number;
  total: number;
  logoDataUri: string;
}

export function BillDocument({
  orderId,
  createdAt,
  guestName,
  guestPhone,
  guestAddress,
  items,
  discountTotal,
  total,
  logoDataUri,
}: BillDocumentProps) {
  const itemsSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const orderNumber = orderId.slice(0, 8).toUpperCase();
  const dateLabel = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Document title={`Bill - Order #${orderNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image src={logoDataUri} style={styles.logo} />
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandName}>Charm Avenue</Text>
              <Text style={styles.brandTagline}>
                by Nandini · Cute accessories & everyday finds
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.billTitle}>BILL</Text>
            <Text style={styles.billMeta}>Order #{orderNumber}</Text>
            <Text style={styles.billMeta}>{dateLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {(guestName || guestPhone || guestAddress) && (
          <View style={styles.billToBlock}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            {guestName && <Text style={styles.billToText}>{guestName}</Text>}
            {guestPhone && <Text style={styles.billToText}>{guestPhone}</Text>}
            {guestAddress && <Text style={styles.billToText}>{guestAddress}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colItem]}>Item</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Price</Text>
            <Text style={[styles.th, styles.colAmount]}>Amount</Text>
          </View>
          {items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.colItem}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.variantLabel && <Text style={styles.itemMeta}>{item.variantLabel}</Text>}
                {item.personalizationText && (
                  <Text style={styles.itemMeta}>&quot;{item.personalizationText}&quot;</Text>
                )}
              </View>
              <Text style={[styles.bodyValue, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.bodyValue, styles.colPrice]}>₹{item.unitPrice}</Text>
              <Text style={[styles.itemName, styles.colAmount]}>
                ₹{item.unitPrice * item.quantity}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryWrap}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items Subtotal</Text>
              <Text style={styles.summaryValue}>₹{itemsSubtotal}</Text>
            </View>
            {discountTotal > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Combo Discount</Text>
                <Text style={styles.discountValue}>−₹{discountTotal}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerThanks}>Thank you for shopping with Charm Avenue!</Text>
          <Text style={styles.footerContact}>
            nandini092006@gmail.com · WhatsApp +91 89572 98041
          </Text>
          <Text style={styles.footerNote}>This is a computer-generated bill.</Text>
        </View>
      </Page>
    </Document>
  );
}
