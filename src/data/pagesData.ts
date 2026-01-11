import { portalPages } from './navigation/portal';
import { studyPages } from './navigation/study';
import { vedaPages, elearningPages, personalPages, hernaPages } from './navigation/personal';
import { 
    eagendaPages, 
    technologyPages, 
    systemManagementPages, 
    documentationPages, 
    personalizationPages, 
    settingsPages, 
    privacyPages 
} from './navigation/system';

// Page item represents a single link/page
interface PageItem {
    id: string;
    label: string;
    href: string;
}

// Page category represents a grouping of related pages
interface PageCategory {
    id: string;
    label: string;
    icon: string;
    expandable: boolean;
    children: PageItem[];
}

export const pagesData: PageCategory[] = [
    {
        "id": "portal-info",
        "label": "Portál veřejných informací",
        "icon": "Info",
        "expandable": true,
        "children": portalPages
    },
    {
        "id": "moje-studium",
        "label": "Moje studium",
        "icon": "GraduationCap",
        "expandable": true,
        "children": studyPages
    },
    {
        "id": "veda-vyzkum",
        "label": "Věda a výzkum",
        "icon": "Microscope",
        "expandable": true,
        "children": vedaPages
    },
    {
        "id": "elearning",
        "label": "eLearning",
        "icon": "Monitor",
        "expandable": true,
        "children": elearningPages
    },
    {
        "id": "osobni-management",
        "label": "Osobní management",
        "icon": "User",
        "expandable": true,
        "children": personalPages
    },
    {
        "id": "eagenda",
        "label": "eAgenda",
        "icon": "Briefcase",
        "expandable": true,
        "children": eagendaPages
    },
    {
        "id": "technologie",
        "label": "Technologie a jejich správa",
        "icon": "Settings",
        "expandable": true,
        "children": technologyPages
    },
    {
        "id": "sprava-is",
        "label": "Správa informačního systému",
        "icon": "Database",
        "expandable": true,
        "children": systemManagementPages
    },
    {
        "id": "dokumentace",
        "label": "Dokumentace UIS",
        "icon": "BookOpen",
        "expandable": true,
        "children": documentationPages
    },
    {
        "id": "herna",
        "label": "Herna pro chvíle oddechu",
        "icon": "Gamepad2",
        "expandable": true,
        "children": hernaPages
    },
    {
        "id": "personalizace",
        "label": "Přizpůsobení informačního systému",
        "icon": "Palette",
        "expandable": true,
        "children": personalizationPages
    },
    {
        "id": "nastaveni-is",
        "label": "Nastavení informačního systému",
        "icon": "Cog",
        "expandable": true,
        "children": settingsPages
    },
    {
        "id": "ochrana-udaju",
        "label": "Ochrana osobních údajů",
        "icon": "Shield",
        "expandable": true,
        "children": privacyPages
    }
];

export const BASE_URL = "https://is.mendelu.cz";
