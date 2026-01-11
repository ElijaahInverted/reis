/**
 * Study Room types and reservation data structures.
 */

export type RoomType = 'individual' | 'team' | 'seminar';

export interface ReservationData {
    roomName: string;
    date: string;
    timeFrom: string;
    timeTo: string;
    name: string;
    uisId: string;
    email: string;
}

export interface UvisTokens {
    formId: string;
    uniqueId: string;
    antiSpamField: string; // e.g. "as-25484978"
    antiSpamValue: string; // e.g. "30"
}

/**
 * Technical form field IDs for UVIS reservation form
 */
export const RESERVATION_FIELDS = {
    STUDOVNA: 'field-7603',
    DATUM: 'datum',
    CAS_OD: 'field-7605',
    CAS_DO: 'field-7606',
    JMENO: 'field-7607',
    ID_UIS: 'field-7608',
    EMAIL: 'field-7609',
    SUBMIT: 'field-7610',
    ANTISPAM: 'as-25',
    FORM_ID: 'form_id',
    UNIQUE_ID: 'unique_id',
} as const;

export const ROOM_OPTIONS = {
    individual: [
        'individuální studovna 1',
        'individuální studovna 2',
    ],
    team: [
        'týmová studovna 1 (10 os.)',
        'týmová studovna 2 (6 os.)',
    ],
    seminar: [
        'seminární místnost (10 a více os.)',
    ]
} as const;
