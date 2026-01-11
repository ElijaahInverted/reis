import { fetchWithAuth } from "../api/client";
import { RESERVATION_FIELDS, type ReservationData, type UvisTokens } from "../types/reservation";
import { loggers } from "../utils/logger";

const UVIS_RESERVATION_URL = "https://uvis.mendelu.cz/rezervace-studoven-knihovny-a";

export class ReservationService {
    /**
     * Submits a reservation request to UVIS via the proxied fetch bridge.
     */
    /**
     * Fetches the UVIS reservation page and extracts dynamic security tokens.
     */
    static async getFormTokens(): Promise<UvisTokens | null> {
        try {
            loggers.api.info('[ReservationService] Fetching dynamic form tokens...');
            const response = await fetchWithAuth(UVIS_RESERVATION_URL, {
                method: 'GET',
            });

            if (!response.ok) {
                loggers.api.error('[ReservationService] Failed to load form page:', response.status);
                return null;
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const formId = doc.querySelector<HTMLInputElement>('input[name="form_id"]')?.value;
            const uniqueId = doc.querySelector<HTMLInputElement>('input[name="unique_id"]')?.value;
            
            // Find anti-spam field (starts with "as-")
            const antiSpamInput = Array.from(doc.querySelectorAll<HTMLInputElement>('input[type="text"]'))
                .find(input => input.name.startsWith('as-'));

            if (!formId || !uniqueId || !antiSpamInput) {
                loggers.api.error('[ReservationService] Failed to parse tokens', { 
                    hasFormId: !!formId, 
                    hasUniqueId: !!uniqueId, 
                    hasAntiSpam: !!antiSpamInput 
                });
                return null;
            }

            loggers.api.info('[ReservationService] Tokens acquired successfully');
            return {
                formId,
                uniqueId,
                antiSpamField: antiSpamInput.name,
                antiSpamValue: antiSpamInput.value // Usually "30" or similar default
            };

        } catch (error) {
            loggers.api.error('[ReservationService] Token fetch error:', error);
            return null;
        }
    }

    /**
     * Submits a reservation request to UVIS via the proxied fetch bridge.
     */
    static async submitReservation(data: ReservationData): Promise<{ success: boolean; error?: string }> {
        loggers.api.info('[ReservationService] Submitting reservation for:', data.roomName, data.date);

        try {
            // 1. Get dynamic tokens first
            const tokens = await this.getFormTokens();
            if (!tokens) {
                 return { success: false, error: 'Nepodařilo se načíst formulář. Zkuste to znovu.' };
            }

            const formData = new URLSearchParams();
            
            // Map our data to technical field names
            formData.append(RESERVATION_FIELDS.STUDOVNA, data.roomName);
            formData.append(RESERVATION_FIELDS.DATUM, data.date);
            formData.append(RESERVATION_FIELDS.CAS_OD, data.timeFrom);
            formData.append(RESERVATION_FIELDS.CAS_DO, data.timeTo);
            formData.append(RESERVATION_FIELDS.JMENO, data.name);
            formData.append(RESERVATION_FIELDS.ID_UIS, data.uisId);
            formData.append(RESERVATION_FIELDS.EMAIL, data.email);
            formData.append(RESERVATION_FIELDS.SUBMIT, 'Odeslat');
            
            // Dynamic Anti-spam & Security fields
            formData.append(tokens.antiSpamField, tokens.antiSpamValue);
            formData.append(RESERVATION_FIELDS.FORM_ID, tokens.formId);
            formData.append(RESERVATION_FIELDS.UNIQUE_ID, tokens.uniqueId);

            const response = await fetchWithAuth(UVIS_RESERVATION_URL, {
                method: 'POST',
                body: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.ok) {
                // UVIS returns 200 even for logic errors (e.g. "Termín je obsazen"), 
                // we should check the response text.
                const responseText = await response.text();
                // Simple heuristic: if it contains "error" class or text, might be failure
                // But for now, let's assume 200 is mostly OK unless proved otherwise by user feedback
                // or if we want to be more robust:
                if (responseText.includes('chyba') || responseText.includes('class="error"')) {
                     loggers.api.warn('[ReservationService] Server responded 200 but content indicates error');
                     // Try to parse error message if possible, or just warn user
                     return { success: false, error: 'Termín je pravděpodobně obsazen nebo nastala chyba.' };
                }

                loggers.api.info('[ReservationService] Reservation submitted successfully');
                return { success: true };
            } else {
                loggers.api.error('[ReservationService] Submission failed with status:', response.status);
                return { success: false, error: `Chyba serveru (${response.status})` };
            }
        } catch (error) {
            loggers.api.error('[ReservationService] Submission error:', error);
            return { success: false, error: 'Chyba připojení. Zkuste to znovu.' };
        }
    }
}
