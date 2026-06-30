import type { AppNotification, NotificationType } from "@/types";
import { apiClient, delay, USE_MOCKS } from "../client";
import { db, DEMO_VENUE_ID, uid } from "../mock-data";

export interface NotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  audience: string;
}

export const notificationsService = {
  async list(venueId: string | null): Promise<AppNotification[]> {
    if (USE_MOCKS) {
      const all = db().notifications;
      return delay(
        (venueId ? all.filter((n) => n.venueId === venueId) : all).sort((a, b) =>
          b.sentAt.localeCompare(a.sentAt),
        ),
      );
    }
    const { data } = await apiClient.get<AppNotification[]>("/notifications", {
      params: { venueId },
    });
    return data;
  },

  async send(input: NotificationInput, venueId: string | null): Promise<AppNotification> {
    if (USE_MOCKS) {
      const ntf: AppNotification = {
        id: uid("ntf"),
        venueId: venueId ?? DEMO_VENUE_ID,
        sentAt: new Date().toISOString(),
        ...input,
      };
      db().notifications.unshift(ntf);
      return delay(ntf, 250);
    }
    const { data } = await apiClient.post<AppNotification>("/notifications", input);
    return data;
  },
};
