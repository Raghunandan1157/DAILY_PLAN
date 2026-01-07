const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function getSlippedLabel(dateStr) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    // Fix: Set to 1st of month to avoid month-end rollover issues (e.g. Mar 31 -> Mar 3)
    targetDate.setDate(1);
    // Go to previous month
    targetDate.setMonth(targetDate.getMonth() - 1);

    return `${monthNames[targetDate.getMonth()]} Slipped`;
}

// Test cases
console.log("Testing getSlippedLabel logic:");
console.log("2025-01-15 ->", getSlippedLabel("2025-01-15")); // Expect DEC Slipped
console.log("2025-03-31 ->", getSlippedLabel("2025-03-31")); // Expect FEB Slipped (The bug case)
console.log("2025-03-01 ->", getSlippedLabel("2025-03-01")); // Expect FEB Slipped
console.log("2025-02-28 ->", getSlippedLabel("2025-02-28")); // Expect JAN Slipped
