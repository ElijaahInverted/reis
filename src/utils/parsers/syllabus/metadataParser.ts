export function parseCourseMetadata(doc: Document, lang: string = 'cs') {
    const info: any = { 
        courseName: null,      // Deprecated: for backward compatibility
        courseNameCs: null,    // Czech name
        courseNameEn: null,    // English name
        credits: null, 
        garant: null, 
        teachers: [], 
        status: null 
    };

    const isValidName = (name: string | null) => {
        if (!name) return false;
        const n = name.toLowerCase().trim();
        // Match -- anything -- as placeholder, or specific English/Czech strings
        return !n.match(/^[-–—]{2}.*[-–—]{2}$/) && 
               !n.includes('not defined') && 
               !n.includes('nebyla zadána');
    };

    doc.querySelectorAll('table tbody tr').forEach(r => {
        const c = r.querySelectorAll('td'); if (c.length < 2) return;
        const l = (c[0].textContent || '').toLowerCase().trim().replace(/:$/, ''), v = c[1];
        const v_txt = v.textContent?.trim() || null;
        
        // Extract BOTH Czech and English names
        if (l === 'název předmětu' && isValidName(v_txt)) {
            info.courseNameCs = v_txt;
        } else if ((l === 'název předmětu anglicky' || l === 'course title in english' || l === 'course title') && isValidName(v_txt)) {
            info.courseNameEn = v_txt;
        }

        // Set deprecated courseName based on lang for backward compatibility
        if (!info.courseName) {
            info.courseName = lang === 'en' ? info.courseNameEn : info.courseNameCs;
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

