import type { Booking, QrPayload, ScanLogEntry } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, uid } from "../mock-data";

export interface CheckInResult {
  ok: boolean;
  reason: string;
  booking?: Booking;
}

export function parseQr(raw: string): QrPayload | null {
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.bookingId === "string") return obj as QrPayload;
    return null;
  } catch {
    // Allow a bare booking id as a fallback payload
    const trimmed = raw.trim();
    if (/^BK\w+$/i.test(trimmed)) {
      return { bookingId: trimmed, userId: "", eventId: "", tableNumber: "", status: "" };
    }
    return null;
  }
}

function validate(payload: QrPayload, scannedBy: string): CheckInResult {
  const booking = db().bookings.find((b) => b.id === payload.bookingId);
  if (!booking) return { ok: false, reason: "Ticket Not Found" };
  if (booking.status === "Cancelled") return { ok: false, reason: "Booking Cancelled", booking };
  if (booking.paymentStatus !== "Paid" || booking.status === "PaymentPending") {
    return { ok: false, reason: "Payment Pending", booking };
  }
  if (booking.status === "CheckedIn") return { ok: false, reason: "Ticket Already Used", booking };
  if (new Date(booking.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "Event Expired", booking };
  }
  return { ok: true, reason: "Entry Approved", booking };
}

export const bookingsService = {
  async list(venueId: string | null): Promise<Booking[]> {
    if (USE_MOCKS) {
      const all = db().bookings;
      return delay(venueId ? all.filter((b) => b.venueId === venueId) : all);
    }
    const { data } = await apiClient.get<Booking[]>("/bookings", { params: { venueId } });
    return data;
  },

  async checkIn(raw: string, scannedBy: string): Promise<CheckInResult> {
    if (USE_MOCKS) {
      const payload = parseQr(raw);
      if (!payload) {
        const log: ScanLogEntry = {
          id: uid("scan"), bookingId: "—", customerName: "Unknown", result: "rejected",
          reason: "Invalid QR Code", scannedBy, scannedAt: new Date().toISOString(),
        };
        db().scanLogs.unshift(log);
        return delay({ ok: false, reason: "Invalid QR Code" }, 200);
      }

      const result = validate(payload, scannedBy);
      if (result.ok && result.booking) {
        result.booking.status = "CheckedIn";
        result.booking.checkedInAt = new Date().toISOString();
        result.booking.checkedInBy = scannedBy;
        const ev = db().events.find((e) => e.id === result.booking!.eventId);
        if (ev) ev.attendance += 1;
      }

      const log: ScanLogEntry = {
        id: uid("scan"),
        bookingId: payload.bookingId,
        customerName: result.booking?.customerName ?? "Unknown",
        result: result.ok ? "approved" : "rejected",
        reason: result.reason,
        scannedBy,
        scannedAt: new Date().toISOString(),
      };
      db().scanLogs.unshift(log);
      return delay(result, 200);
    }
    const { data } = await apiClient.post<CheckInResult>("/bookings/check-in", { qr: raw });
    return data;
  },

  async scanLogs(): Promise<ScanLogEntry[]> {
    if (USE_MOCKS) return delay([...db().scanLogs]);
    const { data } = await apiClient.get<ScanLogEntry[]>("/bookings/scan-logs");
    return data;
  },
};
