import { supabase } from '../services/spolky/supabaseClient';

export async function fetchKillerCourses(): Promise<{ course_code: string; course_name: string }[]> {
    const { data, error } = await supabase
        .from('killer_courses')
        .select('course_code, course_name')
        .eq('is_active', true);
    if (error) {
        console.error('[studyJams] fetchKillerCourses error', error);
        return [];
    }
    return data ?? [];
}

export async function registerAvailability(
    studium: string,
    course_code: string,
    role: 'tutor' | 'tutee',
    semester_id: string,
): Promise<string | null> {
    const { data, error } = await supabase
        .from('study_jam_availability')
        .insert({ studium, course_code, role, semester_id })
        .select('id')
        .single();
    if (error) {
        console.error('[studyJams] registerAvailability error', error);
        return null;
    }
    return (data as { id: string } | null)?.id ?? null;
}

export async function findAndClaimTutor(
    course_code: string,
    semester_id: string,
    tutee_studium: string,
): Promise<string | null> {
    const { data: tutors, error } = await supabase
        .from('study_jam_availability')
        .select('id, studium')
        .eq('course_code', course_code)
        .eq('semester_id', semester_id)
        .eq('role', 'tutor')
        .neq('studium', tutee_studium)
        .limit(1);
    if (error || !tutors || tutors.length === 0) return null;
    const tutor = tutors[0] as { id: string; studium: string };
    await supabase.from('study_jam_availability').delete().eq('id', tutor.id);
    return tutor.studium;
}

export async function deleteAvailability(id: string): Promise<void> {
    await supabase.from('study_jam_availability').delete().eq('id', id);
}
