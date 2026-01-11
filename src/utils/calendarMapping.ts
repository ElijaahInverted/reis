import type { BlockLesson } from '../types/calendarTypes';
import type { ExamSubject, ExamSection } from '../types/exams';
import { parseDate } from './dateHelpers';

/**
 * Filter and map registered exams into BlockLesson format for calendar display.
 */
export function mapExamsToLessons(storedExams: ExamSubject[]): BlockLesson[] {
    if (!storedExams || storedExams.length === 0) return [];

    const allExams: { 
        id: string; 
        subjectCode: string; 
        title: string; 
        start: Date; 
        location: string; 
        meta: { teacher: string; teacherId: string } 
    }[] = [];

    storedExams.forEach(subject => {
        subject.sections.forEach((section: ExamSection) => {
            if (section.status === 'registered' && section.registeredTerm) {
                allExams.push({
                    id: section.id,
                    subjectCode: subject.code,
                    title: `${subject.name} - ${section.name}`,
                    start: parseDate(section.registeredTerm.date, section.registeredTerm.time),
                    location: section.registeredTerm.room || 'Unknown',
                    meta: { 
                        teacher: section.registeredTerm.teacher || 'Unknown',
                        teacherId: section.registeredTerm.teacherId || ''
                    }
                });
            }
        });
    });

    return allExams.map(exam => {
        const dateObj = new Date(exam.start);
        const dateStr = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}`;
        const startTime = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        const endObj = new Date(dateObj.getTime() + 90 * 60000);
        const endTime = `${String(endObj.getHours()).padStart(2, '0')}:${String(endObj.getMinutes()).padStart(2, '0')}`;

        return {
            id: `exam-${exam.id}-${exam.start}`,
            date: dateStr,
            startTime,
            endTime,
            courseCode: exam.subjectCode,
            courseName: exam.title,
            room: exam.location,
            roomStructured: { name: exam.location, id: '' },
            teachers: [{ fullName: exam.meta.teacher, shortName: exam.meta.teacher, id: exam.meta.teacherId }],
            isExam: true,
            examEvent: exam,
            isConsultation: 'false',
            studyId: '',
            facultyCode: '',
            isDefaultCampus: 'true',
            courseId: '',
            campus: '',
            isSeminar: 'false',
            periodId: ''
        } as BlockLesson;
    });
}
