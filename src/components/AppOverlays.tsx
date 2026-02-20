import { WelcomeModal } from './Onboarding/WelcomeModal'
import { SubjectFileDrawer } from './SubjectFileDrawer'
import { FeedbackModal } from './Feedback/FeedbackModal'
import { TutorialModal } from './Tutorials'
import { StudyJamModal } from './StudyJams/StudyJamModal'
import { useAppStore } from '../store/useAppStore'
import type { SelectedSubject } from '../types/app';
import type { Tutorial } from '../services/tutorials';

interface AppOverlaysProps {
    selectedSubject: SelectedSubject | null;
    setSelectedSubject: (subject: SelectedSubject | null) => void;
    isFeedbackOpen: boolean;
    setIsFeedbackOpen: (open: boolean) => void;
    selectedTutorial: Tutorial | null;
    setSelectedTutorial: (tutorial: Tutorial | null) => void;
}

export function AppOverlays({ 
    selectedSubject, setSelectedSubject, 
    isFeedbackOpen, setIsFeedbackOpen, 
    selectedTutorial, setSelectedTutorial 
}: AppOverlaysProps) {
    const isStudyJamOpen = useAppStore(s => s.isStudyJamOpen);
    const setIsStudyJamOpen = useAppStore(s => s.setIsStudyJamOpen);
    return (
        <>
            <SubjectFileDrawer lesson={selectedSubject} isOpen={!!selectedSubject} onClose={() => setSelectedSubject(null)} />
            <WelcomeModal />
            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
            <StudyJamModal isOpen={isStudyJamOpen} onClose={() => setIsStudyJamOpen(false)} />
            {selectedTutorial && <TutorialModal tutorial={selectedTutorial} isOpen={!!selectedTutorial} onClose={() => setSelectedTutorial(null)} />}
        </>
    );
}
