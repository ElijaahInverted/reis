import { describe, it, expect } from 'vitest';
import { parseServerFiles } from './parser';

describe('parseServerFiles - Link Filtering', () => {
    it('should ignore teacher profile and document info links, resolving only download links', () => {
        const html = `
            <table id="tmtab_1">
                <tr class="uis-hl-table lbn">
                    <td class="UISTMNumberCell">1</td>
                    <td>
                        <!-- Subfolder column -->
                        Ostatní
                    </td>
                    <td>
                         <!-- File Name column -->
                         <b>Přednáška 92 -- abstraktní datové typy moduly</b>
                    </td>
                    <td>
                         <!-- Author/Teacher cell with unwanted link -->
                         <a href="/auth/lide/clovek.pl?id=1728;lang=cz">doc. Ing. Oldřich Trenz, Ph.D.</a>
                    </td>
                    <td>
                         <!-- Date -->
                         29. 1. 2026
                    </td>
                    <td>
                         <!-- Actions/Links cell -->
                         <!-- Unwanted info link with specific sysid -->
                         <a href="/auth/dok_server/dokumenty_ct.pl?id=1728;lang=cz">
                            <img sysid="mime-prohlizeni-info" src="info.gif">
                         </a>
                         
                         <!-- Another unwanted info link with just type implied -->
                         <a href="/auth/dok_server/dokumenty_ct.pl?id=9999;lang=cz">
                            <img sysid="mime-prohlizeni-info" src="info2.gif">
                         </a>
                         
                         <!-- WANTED download link -->
                         <a href="/auth/dok_server/slozka.pl?download=350247;id=150953;z=1;lang=cz">
                            <img sysid="mime-pdf" src="pdf.gif">
                         </a>
                    </td>
                </tr>
            </table>
        `;

        const result = parseServerFiles(html);
        const file = result.files[0];

        expect(result.files).toHaveLength(1);
        expect(file.file_name).toBe('Přednáška 92 -- abstraktní datové typy moduly');
        
        // Before fix: This would likely have 3 files/links
        // After fix: Should have only 1
        expect(file.files).toHaveLength(1);
        expect(file.files[0].link).toContain('slozka.pl?download=');
        expect(file.files[0].type).toBe('pdf');
    });
});
