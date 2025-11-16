export const baseStatusStyles: {
    [key: string]: {
        icon: string;
        color: string;
        label: string;
    };
} = {
    // Practitioner roles
    admin: {
        icon: 'admin_panel_settings',
        color: 'blue',
        label: 'Admin'
    },
    receptionist: {
        icon: 'person',
        color: 'teal',
        label: 'Receptionist'
    },

    doctor: {
        icon: 'medical_services',
        color: 'red',
        label: 'Doctor'
    },
    nurse: {
        icon: 'local_hospital',
        color: 'green',
        label: 'Nurse'
    },
    lab: {
        icon: 'science',
        color: 'purple',
        label: 'Lab'
    },
    pharmacy: {
        icon: 'local_pharmacy',
        color: 'orange',
        label: 'Pharmacy'
    },
    patient: {
        icon: 'person',
        color: 'gray',
        label: 'Patient'
    },
    cashier: {
        icon: 'attach_money',
        color: 'amber',
        label: 'Cashier'
    },
    consultant: {
        icon: 'psychology',
        color: 'indigo',
        label: 'Consultant'
    },
    unknown: {
        icon: 'help_outline',
        color: 'gray',
        label: 'Unknown'
    },


    // food | medication | environment | biologic - alergy type
    //issued & balance
    issued: {
        icon: "check_circle",
        color: "blue",
        label: "Issued"
    },
    // balanced: {


    // },
    food: {
        //icon for food allergy
        icon: "fastfood",
        color: "green",
        label: "Food Available"


    },
    medication: {
        icon: "medication",
        color: "blue",
        label: "Medication Available"
    },
    environment: {
        icon: "nature",
        color: "green",
        label: "Environment Available"
    },
    biologic: {
        icon: "biotech",
        color: "purple",
        label: "Biologic Available"
    },
    // unconfirmed | presumed | confirmed | refuted | entered-in-error
    unconfirmed: {

        //icon for unconfirmed allergy
        icon: "help_outline",


        color: "gray",
        label: "Unconfirmed"
    },
    presumed: {
        //icon for presumed allergy
        icon: "help",
        color: "blue",
        label: "Presumed"
    },
    confirmed: {
        icon: "check_circle",
        color: "green",
        label: "Confirmed"
    },
    refuted: {
        icon: "block",
        color: "red",
        label: "Refuted"
    },

    available: {
        icon: "check_circle",
        color: "green",
        label: "Available"
    },
    active: {
        icon: "check_circle",
        color: "green",
        label: "Active"
    },

    //final
    final: {
        icon: "done_all",
        color: "dark-green", // dark green
        label: "Final"
    },
    approved: {
        icon: "check_circle",
        color: "green",
        label: "Approved"
    },
    "on-hold": {
        icon: "pause_circle",
        color: "orange",
        label: "On Hold"
    },
    "pending": {
        icon: "pause_circle",
        color: "orange",
        label: "Pending"
    },
    ended: {
        icon: "stop_circle",
        color: "#6A1B9A", // deep purple
        label: "Ended"
    },
    stopped: {
        icon: "block",
        color: "red",
        label: "Stopped"
    },
    rejected: {
        icon: "block",
        color: "red",
        label: "Rejected"
    },
    completed: {
        icon: "done_all",
        color: "dark-green", // dark green
        label: "Completed"
    },

    finished: {
        icon: "done_all",
        color: "dark-green", // dark green
        label: "Completed"
    },

    cancelled: {
        icon: "cancel",
        color: "deep-red",
        label: "Cancelled"
    },
    unavailable: {
        icon: "cancel",
        color: "#B71C1C", // deep red
        label: "Unavailable"
    },
    "entered-in-error": {
        icon: "error",
        color: "#E53935", // warning red
        label: "Entered in Error"
    },
    draft: {
        icon: "edit_note",
        color: "gray",
        label: "Draft"
    },
    'no role': {
        icon: "help_outline",
        color: "gray",
        label: "Unknown"
    },
    //order
    order: {
        icon: "assignment",
        color: "blue", // blue
        label: "Order"
    },

    // FHIR Task Status Values - Additional entries needed
    requested: {
        icon: "assignment_turned_in",
        color: "blue",
        label: "Requested"
    },
    received: {
        icon: "inbox",
        color: "blue",
        label: "Received"
    },
    accepted: {
        icon: "thumb_up",
        color: "green",
        label: "Accepted"
    },
    ready: {
        icon: "play_circle",
        color: "green",
        label: "Ready"
    },
    "in-progress": {
        icon: "hourglass_empty",
        color: "orange",
        label: "In Progress"
    },
    failed: {
        icon: "error_outline",
        color: "red",
        label: "Failed"
    }
};
