export const medicationIntentStyles: {
    [key: string]: {
        icon: string;
        color: string;
        label: string;
    };
} = {
    proposal: {
        icon: "lightbulb",
        color: "blue",
        label: "Proposal"
    },
    plan: {
        icon: "event_note",
        color: "#0288D1", // light blue
        label: "Plan"
    },
    order: {
        icon: "shopping_bag",
        color: "green",
        label: "Order"
    },
    "original-order": {
        icon: "assignment",
        color: "#2E7D32", // dark green
        label: "Original Order"
    },
    "reflex-order": {
        icon: "repeat",
        color: "orange",
        label: "Reflex Order"
    },
    "filler-order": {
        icon: "input",
        color: "#6A1B9A", // purple
        label: "Filler Order"
    },
    "instance-order": {
        icon: "file_present",
        color: "#5C6BC0", // indigo
        label: "Instance Order"
    },
    option: {
        icon: "tune",
        color: "gray",
        label: "Option"
    }
};
