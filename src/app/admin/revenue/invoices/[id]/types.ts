import type { LineItem } from "../../InvoicesTab";

export type InvoiceDetail = {
  id: string;
  invoice_number: string;
  campaign_id: string | null;
  advertiser: string;
  advertiser_email: string | null;
  line_items: LineItem[];
  subtotal_zar: number;
  tax_zar: number;
  total_zar: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  campaigns: { id: string; client_name: string | null } | null;
};
