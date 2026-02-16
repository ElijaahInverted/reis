export interface Classmate {
    personId: number;
    photoUrl: string;
    name: string;
    studyInfo: string;
    messageUrl?: string;
}

export interface ClassmatesData {
    all: Classmate[];
    seminar: Classmate[];
}
