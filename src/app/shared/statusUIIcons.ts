export const baseStatusStyles: {
    [key: string]: {
        icon: string;
        color: string;
        label: string;
    };
} = {
    active: {
        icon: "check_circle",
        color: "green",
        label: "Active"
    },
    "on-hold": {
        icon: "pause_circle",
        color: "orange",
        label: "On Hold"
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
    completed: {
        icon: "done_all",
        color: "#2E7D32", // dark green
        label: "Completed"
    },
    cancelled: {
        icon: "cancel",
        color: "#B71C1C", // deep red
        label: "Cancelled"
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
    unknown: {
        icon: "help_outline",
        color: "#757575",
        label: "Unknown"
    }
};
