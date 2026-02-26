import type { Person, Subject } from './types';
import { parseMendeluResults, parseGlobalPeopleResults } from './peopleParser';
import { parseMendeluProfileResult } from './peopleParserProfile';
import { parseSubjectResults } from './subjectParser';

const BASE_LIDE_URL = 'https://is.mendelu.cz/auth/lide/';

/**
 * Fetch a single person profile directly by their IS student ID.
 * More reliable than searchPeople() for known IDs (no ambiguous name results).
 */
export async function fetchPersonProfile(studentId: string): Promise<Person | null> {
    try {
        const url = `${BASE_LIDE_URL}clovek.pl?id=${studentId};lang=cz`;
        const response = await fetch(url, { credentials: 'include' });
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const results = parseMendeluProfileResult(doc, BASE_LIDE_URL);
        return results[0] ?? null;
    } catch (error) {
        console.error('[searchService] fetchPersonProfile error', error);
        return null;
    }
}

export async function searchPeople(personName: string): Promise<Person[]> {
    const formData = new URLSearchParams();
    formData.append('vzorek', personName);
    formData.append('cokoliv', '0');
    formData.append('lide', '1');
    formData.append('pocet', '1000');

    try {
        const response = await fetch('https://is.mendelu.cz/auth/lide/index.pl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
            credentials: 'include',
        });

        const html = await response.text();
        return parseMendeluResults(html);
    } catch (error) {
        console.error('Error searching for person:', error);
        return [];
    }
}

export async function searchGlobal(query: string): Promise<{ people: Person[]; subjects: Subject[] }> {
    const formData = new URLSearchParams();
    formData.append('lang', 'cz');
    formData.append('vzorek', query);
    formData.append('vyhledat', 'Vyhledat');
    formData.append('oblasti', 'lide');
    formData.append('oblasti', 'predmety');
    formData.append('pocet', '50');

    try {
        const response = await fetch('https://is.mendelu.cz/auth/hledani/index.pl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
            credentials: 'include',
        });

        const html = await response.text();
        const people = parseGlobalPeopleResults(html);
        const subjects = parseSubjectResults(html);

        return { people, subjects };
    } catch (error) {
        console.error('Error in global search, falling back to people-only:', error);
        const people = await searchPeople(query);
        return { people, subjects: [] };
    }
}
