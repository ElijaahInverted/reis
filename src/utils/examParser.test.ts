import { describe, it, expect } from 'vitest';
import { parseExamData } from './examParser';

describe('examParser', () => {
    it('parses deregistration deadline with standard <br> tags', () => {
        const html = `
            <html><body>
            <table id="table_1"><tbody>
            <tr>
                <td></td><td>1.</td><td>CODE</td><td>Subject</td><td></td>
                <td>01.01.2026 10:00</td><td>Room</td><td>zkouška</td><td>Teacher</td>
                <td>10/10</td><td>Regular</td>
                <td>--<br>01.01.2026 09:00<br>31.12.2025 23:59</td>
                <td>Info</td><td>Unregister</td>
            </tr>
            </tbody></table>
            </body></html>
        `;
        const result = parseExamData(html);
        const term = result[0].sections[0].registeredTerm;
        expect(term?.deregistrationDeadline).toBe('31.12.2025 23:59');
    });

    it('parses deregistration deadline with self-closing <br /> tags', () => {
        const html = `
            <html><body>
            <table id="table_1"><tbody>
            <tr>
                <td></td><td>1.</td><td>CODE</td><td>Subject</td><td></td>
                <td>01.01.2026 10:00</td><td>Room</td><td>zkouška</td><td>Teacher</td>
                <td>10/10</td><td>Regular</td>
                <td>--<br />01.01.2026 09:00<br />31.12.2025 23:59</td>
                <td>Info</td><td>Unregister</td>
            </tr>
            </tbody></table>
            </body></html>
        `;
        const result = parseExamData(html);
        const term = result[0].sections[0].registeredTerm;
        expect(term?.deregistrationDeadline).toBe('31.12.2025 23:59');
    });

    it('parses deregistration deadline with mixed <br> tags', () => {
        const html = `
            <html><body>
            <table id="table_1"><tbody>
            <tr>
                <td></td><td>1.</td><td>CODE</td><td>Subject</td><td></td>
                <td>01.01.2026 10:00</td><td>Room</td><td>zkouška</td><td>Teacher</td>
                <td>10/10</td><td>Regular</td>
                <td>--<br>01.01.2026 09:00<br/>31.12.2025 23:59</td>
                <td>Info</td><td>Unregister</td>
            </tr>
            </tbody></table>
            </body></html>
        `;
        const result = parseExamData(html);
        const term = result[0].sections[0].registeredTerm;
        expect(term?.deregistrationDeadline).toBe('31.12.2025 23:59');
    });

    it('parses deregistration deadline when earlier column has <br> tags (e.g., zkouška<br>(e-test))', () => {
        const html = `
            <html><body>
            <table id="table_1"><tbody>
            <tr>
                <td></td><td>1.</td><td>CODE</td><td>Subject</td><td></td>
                <td>01.01.2026 10:00</td><td>Room</td>
                <td>zkouška<br>(e-test)</td>
                <td>Teacher</td>
                <td>10/10</td><td>Regular</td>
                <td>--<br>01.01.2026 09:00<br>31.12.2025 23:59</td>
                <td>Info</td><td>Unregister</td>
            </tr>
            </tbody></table>
            </body></html>
        `;
        const result = parseExamData(html);
        const term = result[0].sections[0].registeredTerm;
        expect(term?.deregistrationDeadline).toBe('31.12.2025 23:59');
    });

    it('capitalizes the exam section name', () => {
        const html = `
            <html><body>
            <table id="table_1"><tbody>
            <tr>
                <td></td><td>1.</td><td>CODE</td><td>Subject</td><td></td>
                <td>01.01.2026 10:00</td><td>Room</td><td>průběžný test 2</td><td>Teacher</td>
                <td>10/10</td><td>Regular</td>
                <td>--<br>01.01.2026 09:00<br>31.12.2025 23:59</td>
                <td>Info</td><td>Unregister</td>
            </tr>
            </tbody></table>
            </body></html>
        `;
        const result = parseExamData(html);
        const section = result[0].sections[0];
        expect(section.name).toBe('Průběžný test 2');
    });

    it('groups multiple available terms under the same section', () => {
        const html = `
            <html><body>
            <table id="table_2"><tbody>
            <tr>
                <td></td><td>1.</td><td>CODE</td><td>Subject</td><td></td>
                <td>01.01.2026 10:00</td><td>Room 1</td><td>zkouška</td><td>Teacher 1</td>
                <td>10/100</td><td>Regular</td><td>Dates</td>
                <td><a href="prihlasit_ihned=1&termin=1">Register</a></td>
            </tr>
            <tr>
                <td></td><td>2.</td><td>CODE</td><td>Subject</td><td></td>
                <td>05.01.2026 14:00</td><td>Room 2</td><td>zkouška</td><td>Teacher 2</td>
                <td>20/100</td><td>Regular</td><td>Dates</td>
                <td><a href="prihlasit_ihned=1&termin=2">Register</a></td>
            </tr>
            </tbody></table>
            </body></html>
        `;
        const result = parseExamData(html);
        expect(result).toHaveLength(1);
        expect(result[0].sections).toHaveLength(1);
        expect(result[0].sections[0].name).toBe('Zkouška');
        expect(result[0].sections[0].terms).toHaveLength(2);
        expect(result[0].sections[0].terms[0].id).toBe('1');
        expect(result[0].sections[0].terms[1].id).toBe('2');
    });
});
