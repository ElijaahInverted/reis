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
    studentId: string,
    courseCode: string,
    role: 'tutor' | 'tutee',
): Promise<boolean> {
    const { error } = await supabase.rpc('register_study_jam_availability', {
        p_student_id: studentId,
        p_course_code: courseCode,
        p_role: role,
    });
    if (error) {
        console.error('[studyJams] registerAvailability error', error);
        return false;
    }
    return true;
}

export async function fetchMyTutoringMatch(
    studentId: string,
): Promise<{ tutor_student_id: string; tutee_student_id: string; course_code: string } | null> {
    const { data, error } = await supabase
        .from('tutoring_matches')
        .select('tutor_student_id, tutee_student_id, course_code')
        .or(`tutor_student_id.eq.${studentId},tutee_student_id.eq.${studentId}`)
        .limit(1)
        .maybeSingle();
    if (error) {
        console.error('[studyJams] fetchMyTutoringMatch error', error);
        return null;
    }
    return data as { tutor_student_id: string; tutee_student_id: string; course_code: string } | null;
}

export async function fetchMyAvailability(studentId: string): Promise<{ course_code: string; role: 'tutor' | 'tutee' }[]> {
    const { data, error } = await supabase
        .from('study_jam_availability')
        .select('course_code, role')
        .eq('student_id', studentId);
    if (error) {
        console.error('[studyJams] fetchMyAvailability error', error);
        return [];
    }
    return data as { course_code: string; role: 'tutor' | 'tutee' }[] ?? [];
}

export async function deleteAvailability(studentId: string, courseCode: string): Promise<void> {
    const { error } = await supabase.rpc('delete_study_jam_availability', {
        p_student_id: studentId,
        p_course_code: courseCode,
    });
    if (error) {
        console.error('[studyJams] deleteAvailability error', error);
    }
}

export async function dismissStudyJam(studentId: string, courseCode: string): Promise<boolean> {
    const { error } = await supabase.rpc('dismiss_study_jam_suggestion', {
        p_student_id: studentId,
        p_course_code: courseCode,
    });
    if (error) {
        console.error('[studyJams] dismissStudyJam error', error);
        return false;
    }
    return true;
}

export async function withdrawMatch(studentId: string, courseCode: string): Promise<void> {
    const { error } = await supabase.rpc('withdraw_study_jam_match', {
        p_student_id: studentId,
        p_course_code: courseCode,
    });
    if (error) {
        console.error('[studyJams] withdrawMatch error', error);
    }
}

export async function fetchMyDismissals(studentId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('study_jam_dismissals')
        .select('course_code')
        .eq('student_id', studentId);
    if (error) {
        console.error('[studyJams] fetchMyDismissals error', error);
        return [];
    }
    return (data as { course_code: string }[] ?? []).map(r => r.course_code);
}
