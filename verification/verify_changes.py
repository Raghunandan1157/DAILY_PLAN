import os
import sys
from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Get absolute path to index.html
        cwd = os.getcwd()
        url = f"file://{cwd}/index.html"

        page = browser.new_page()
        page.goto(url)

        # Check Button Text with mocked data and state
        page.evaluate("""
            // Mock state
            state.role = 'CEO';
            state.currentUser = 'CEO';
            state.activeTab = 'reports';

            // Mock rawData headers for calculateTotalCollectionPercentage
            state.rawData = {
                headers: ['Branch', 'District', 'DM Name', 'Region'],
                rows: [['TestBranch', 'TestDistrict', 'TestDM', 'TestRegion']]
            };

            // Mock branchDetails
            state.branchDetails = {
                'TestBranch': {
                    target: { ftod_plan: 100, nov_25_Slipped_Accounts_Plan: 10, pnpa_plan: 10 },
                    achievement: { ftod_actual: 50, nov_25_Slipped_Accounts_Actual: 5, pnpa_actual: 5 }
                }
            };

            // Mock System Date to Jan 15 2025 to test dynamic label (Prev Month = DEC)
            state.systemDate = '2025-01-15';

            // Trigger renderReports
            const buffer = document.createElement("div");
            renderReports(buffer);
            document.getElementById("dashboard-container").appendChild(buffer);
        """)

        # Take screenshot of the buttons
        page.screenshot(path="verification/button.png")
        print("Captured button.png")

        # Verify Button Text
        btn_text = page.inner_text("button:has-text('Generate Plan & Achievement Reports')")
        print(f"Button Text: {btn_text}")
        if "50%" in btn_text:
            print("SUCCESS: Button shows correct percentage (50%)")
        else:
            print(f"FAILURE: Button text does not contain 50%: {btn_text}")

        # 2. Verify Table Headers (Plan Report)
        page.evaluate("""
            const rows = [{
                name: 'TestBranch',
                data: { ftod_plan: 100 }
            }];
            const html = generateReportHTML('Test Report', 'BRANCH', rows, true);
            document.body.innerHTML = html; // Replace body to show table
        """)

        page.screenshot(path="verification/table_headers.png")
        print("Captured table_headers.png")

        content = page.content()
        if "Amt" in content:
            print("SUCCESS: Found 'Amt' in table headers")
        if "DEC Slipped" in content:
            print("SUCCESS: Found 'DEC Slipped' in table headers")
        if "A/c" in content:
            print("SUCCESS: Found 'A/c' in table headers")

        browser.close()

if __name__ == "__main__":
    verify_changes()
