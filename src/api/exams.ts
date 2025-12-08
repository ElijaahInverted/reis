import { parseExamData } from "../utils/examParser";
import type { ExamSubject } from "../components/ExamDrawer";
import { fetchWithAuth } from "./client";

const EXAM_URL = 'https://is.mendelu.cz/auth/student/terminy_seznam.pl?studium=149707;obdobi=801;lang=cz';

export async function fetchExamData(): Promise<ExamSubject[]> {
    try {
        const response = await fetchWithAuth(EXAM_URL);
        const html = await response.text();
        const data = parseExamData(html);
        return data;
    } catch (error) {
        console.error("Error fetching exam data:", error);
        return [];
    }
}

export async function registerExam(termId: string): Promise<boolean> {
    try {
        // URL based on user provided HTML: 
        // terminy_seznam.pl?termin=327621;studium=149707;obdobi=801;prihlasit_ihned=1;lang=cz
        const url = `https://is.mendelu.cz/auth/student/terminy_seznam.pl?termin=${termId}&studium=149707&obdobi=801&prihlasit_ihned=1&lang=cz`;

        const response = await fetchWithAuth(url);
        // Response is OK if we get here (fetchWithAuth throws on error)
        void response; // Acknowledge we're not using the response body
        return true;
    } catch (error) {
        console.error("Error registering for exam:", error);
        return false;
    }
}

export async function unregisterExam(termId: string): Promise<boolean> {
    try {
        // URL based on user provided HTML:
        // terminy_seznam.pl?termin=327145;studium=149707;obdobi=801;odhlasit_ihned=1;lang=cz
        const url = `https://is.mendelu.cz/auth/student/terminy_seznam.pl?termin=${termId}&studium=149707&obdobi=801&odhlasit_ihned=1&lang=cz`;

        const response = await fetchWithAuth(url);
        void response;
        return true;
    } catch (error) {
        console.error("Error unregistering from exam:", error);
        return false;
    }
}

