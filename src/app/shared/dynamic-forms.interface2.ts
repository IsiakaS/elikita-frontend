export interface generalFieldsData {
    fieldName: string,
    fieldApiName: string,
    fieldLabel?: string,
    fieldPlaceholder?: string,
    fieldHint?: string,
    moreHint?: string,
    inputType?: string,
    fieldErrorHint?: string,
    value?: any,
    isArray: boolean,
    auth?: {
        read: string,
        write: string
    }
    fieldType: 'CodeableConceptFieldFromBackEnd' | 'IndividualField' | 'SingleCodeField' | 'ReferenceFieldArray' | 'CodeableConceptField' | 'CodeField' | 'IndividualReferenceField'
    validations?: {
        type: 'default' | 'custom',
        name: any,
        isFunction: boolean,
        functionArgs?: any[]
    }[]
    isGroup: boolean
}

export interface formMetaData {
    formName: string,
    formDescription: string,
    submitText?: string,

}

export interface codeableConceptFromBackEndDataType {

    coding: {
        system: string,
        code: string,
        display: string
    }[],
    text?: string


}

export interface CodeableConceptFieldFromBackEnd {
    generalProperties: generalFieldsData,
    data: string[]
}


export interface codeableConceptDataType {

    coding: {
        system: string,
        code: string,
        display: string
    }[],
    text?: string

}

export interface ReferenceDataType {
    type?: string,
    reference?: string,
    display?: string,
    identifier?: {
        system?: string,
        value?: string
    },
    [key: string]: any
}

export interface codingDataType {
    system: string,
    code: string,
    display: string
}

export interface IndividualField {
    generalProperties: generalFieldsData,
    data: any,
    dataType: string,

}

export interface SingleCodeField {
    generalProperties: generalFieldsData,
    data: any[],
    dataType: string,

}




export interface IndividualReferenceField {
    generalProperties: generalFieldsData,
    data: ReferenceDataType[],
}

export interface ReferenceFieldArray {
    generalProperties: generalFieldsData,
    data: ReferenceDataType[]
}

export interface CodeableConceptField {
    generalProperties: generalFieldsData,
    data: codeableConceptDataType | string[]
}

export interface CodeField {
    generalProperties: generalFieldsData,
    data: codingDataType[]
}

export interface GroupField {

    generalProperties: generalFieldsData,
    data?: IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField,
    groupFields: {
        [key: string]: IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField
    },
    keys: string[]

}

// export interface formFields {
//      IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField
// }