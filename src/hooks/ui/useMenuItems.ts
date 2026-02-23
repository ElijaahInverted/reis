import { Layers } from 'lucide-react';
import { createElement } from 'react';
import { getMainMenuItems } from '../../components/menuConfig';
import { useSubjects } from '../data/useSubjects';
import { useUserParams } from '../useUserParams';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../useTranslation';
import type { SubjectInfo } from '../../types/documents';
import type { MenuItem } from '../../components/menuConfig';

interface UseMenuItemsOptions {
  interleaveColumns?: boolean;
}

export function useMenuItems({ interleaveColumns = false }: UseMenuItemsOptions = {}): MenuItem[] {
  const { subjects } = useSubjects();
  const { params } = useUserParams();
  const files = useAppStore(state => state.files);
  const syllabuses = useAppStore(state => state.syllabuses.cache);
  const language = useAppStore(state => state.language);
  const { t } = useTranslation();

  return getMainMenuItems(params?.studium ?? '', params?.obdobi ?? '', t, language).map(item => {
    const p = { ...item };
    if (item.id === 'subjects' && subjects) {
      p.expandable = true;
      const sortedSubjects = Object.values(subjects.data).sort((a: SubjectInfo, b: SubjectInfo) => {
        const aHasFiles = (files[a.subjectCode]?.length ?? 0) > 0;
        const bHasFiles = (files[b.subjectCode]?.length ?? 0) > 0;
        if (aHasFiles && !bHasFiles) return -1;
        if (!aHasFiles && bHasFiles) return 1;
        const aName = a.displayName.replace(a.subjectCode, '').trim();
        const bName = b.displayName.replace(b.subjectCode, '').trim();
        return aName.localeCompare(bName);
      });

      const orderedSubjects = interleaveColumns
        ? interleaveForColumns(sortedSubjects)
        : sortedSubjects;

      p.children = orderedSubjects.map((s: SubjectInfo) => {
        const syllabus = syllabuses[s.subjectCode];
        const storeName = language === 'cz' ? s.nameCs : s.nameEn;
        const syllabusName = language === 'cz'
          ? (syllabus?.courseInfo?.courseNameCs || syllabus?.courseInfo?.courseName)
          : (syllabus?.courseInfo?.courseNameEn || syllabus?.courseInfo?.courseName);
        const displayLabel = storeName || syllabusName || s.displayName.replace(s.subjectCode, '').trim();

        return {
          id: `subject-${s.subjectCode}`,
          label: displayLabel,
          icon: createElement(Layers, { className: 'w-4 h-4' }),
          isSubject: true,
          courseCode: s.subjectCode,
          subjectId: s.subjectId
        };
      });
    }
    return p;
  });
}

function interleaveForColumns(subjects: SubjectInfo[]): SubjectInfo[] {
  const numRows = Math.ceil(subjects.length / 2);
  const result = [];
  for (let i = 0; i < numRows; i++) {
    result.push(subjects[i]);
    if (i + numRows < subjects.length) {
      result.push(subjects[i + numRows]);
    }
  }
  return result;
}
