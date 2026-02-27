import { supabase } from '../services/spolky/supabaseClient';

export async function submitFeedback(
    studentId: string,
    facultyId: string,
    studySemester: number,
    feedbackType: 'nps' | 'one_change',
    value: string,
    semesterCode: string,
): Promise<boolean> {
    const { error } = await supabase.rpc('submit_feedback', {
        p_student_id: studentId,
        p_faculty_id: facultyId,
        p_study_semester: studySemester,
        p_feedback_type: feedbackType,
        p_value: value,
        p_semester_code: semesterCode,
    });
    if (error) {
        console.error('[feedback] submitFeedback error', error);
        return false;
    }
    return true;
}

export async function trackDailyUsage(studentId: string): Promise<void> {
    const { error } = await supabase.rpc('track_daily_usage', {
        p_student_id: studentId,
    });
    if (error) {
        console.error('[feedback] trackDailyUsage error', error);
    }
}
