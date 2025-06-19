export interface formMetaData {
    formName: string,
    formDescription: string,
    submitText?: string,

}

export interface formFields {
    fieldName: string,
    fieldApiName: string,
    fieldLabel?: string,
    fieldPlaceholder?: string,
    fieldHint: string,
    moreHint: string,
    fieldErrorHint: string,
    dataType: string,
    value?: any,
    includeUse?: boolean,

    useArray?: any[],
    Reference?: {
        reference: string,
        display: string,
        [key: string]: any
    }[],
    validations?: {
        type: 'default' | 'custom',
        name: any,
        isFunction: boolean,
        functionArgs?: any[]
    }[]
    codingSystems?: string,
    codingConcept?: {
        code: string,
        display: string
    }[],
    BackboneElement_Array?: boolean,
    code: any[],

    OtherMetaData: {
        [key: string]: any
    }
}