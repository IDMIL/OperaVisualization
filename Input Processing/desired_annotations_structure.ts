import {LanguageCode} from "./text";

export type AnnotationCode = 'dy' | 'du' | 'for' | 'int' | 'mo' | 'tim' | 'graph';

export interface Annotation {
    code : Array<AnnotationCode>;
    annotation : {[language in LanguageCode] : string};
    annotation_source : string;
}

export interface AnnotationGroup {
    act : number;
    is_general: boolean;
    page_range: [number, number];
    measure_range : [number, number];
    annotations : Array<Annotation>;
}


export const annotations : Array<AnnotationGroup> = ...