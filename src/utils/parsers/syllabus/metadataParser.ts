export function parseCourseMetadata(doc: Document, lang: string = 'cs') {
    const info: any = { courseName: null, credits: null, garant: null, teachers: [], status: null };
    const targetLang = lang === 'en' ? 'en' : 'cs';

    doc.querySelectorAll('table tbody tr').forEach(r => {
        const c = r.querySelectorAll('td'); if (c.length < 2) return;
        const l = (c[0].textContent || '').toLowerCase().trim().replace(/:$/, ''), v = c[1];
        const v_txt = v.textContent?.trim() || null;
        
        const isValidName = (name: string | null) => {
            if (!name) return false;
            const n = name.toLowerCase().trim();
            // Match -- anything -- as placeholder, or specific English/Czech strings
            return !n.match(/^[-–—]{2}.*[-–—]{2}$/) && 
                   !n.includes('not defined') && 
                   !n.includes('nebyla zadána');
        };
        
        // Match course name with language awareness
        if (targetLang === 'cs') {
            if (l === 'název předmětu' && isValidName(v_txt)) {
                info.courseName = v_txt;
            } else if (!info.courseName && (l === 'course title in english' || l === 'název předmětu anglicky') && isValidName(v_txt)) {
                info.courseName = v_txt;
            }
        } else {
            // English prioritize "Course title" or "Course title in English"
            if ((l === 'course title' || l === 'course title in english') && isValidName(v_txt)) {
                info.courseName = v_txt;
            } else if (!info.courseName && (l === 'název předmětu' || l === 'course title in czech' || l === 'název předmětu česky') && isValidName(v_txt)) {
                info.courseName = v_txt;
            }
        }

        // Match Czech and English labels strictly
        if (l === 'způsob ukončení' || l === 'completion' || l === 'mode of completion and number of credits') {
             // Prioritize bold text (e.g. "Exam") then full text
             const bold = v.querySelector('b')?.textContent?.trim();
             info.credits = bold || v_txt;
        }
        if (l === 'garant předmětu' || l === 'guarantor' || l === 'course supervisor') {
             info.garant = v.querySelector('a')?.textContent?.trim() || v_txt;
        }
        if (l === 'typ předmětu' || l === 'course type') {
             info.status = v_txt;
        }
        if (l === 'vyučující' || l === 'instructors' || l === 'teachers') {
            v.querySelectorAll('a').forEach(a => {
                const role = a.parentNode?.textContent?.match(/\(([^)]+)\)/);
                info.teachers.push({ name: a.textContent?.trim() || '', roles: role ? role[1] : '' });
            });
        }
    });
    return info;
}
