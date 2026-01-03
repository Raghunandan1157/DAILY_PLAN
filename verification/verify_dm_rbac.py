from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load the page
    page.goto(f"file://{os.getcwd()}/index.html")

    # 1. Simulate DM Login
    print("Selecting DM...")
    # Wait for select element
    page.wait_for_selector("#dmSelect")

    # Select 'PUTTA PRASAD'
    page.select_option("#dmSelect", "PUTTA PRASAD")

    print("Clicking Login...")
    page.click("#login-btn-dm")

    # 2. Handle Date Selection Overlay (Specific to DM)
    print("Waiting for Date Selection...")
    # DM login triggers 'daily-overlay'
    page.wait_for_selector("#btn-date-0")

    print("Selecting Today...")
    page.click("#btn-date-0")

    # 3. Wait for Main App UI
    print("Waiting for App UI...")
    page.wait_for_selector(".main-content:not(.hidden)")

    # 4. Check Sidebar
    print("Checking Sidebar...")
    # Reports should be visible for DM now
    reports_nav = page.locator("#nav-reports")
    if reports_nav.is_visible():
        print("PASS: Reports nav is visible.")
    else:
        print("FAIL: Reports nav is hidden.")

    # 5. Switch to Reports Tab
    print("Switching to Reports Tab...")
    page.click("#nav-reports")

    # Wait for Reports UI
    page.wait_for_selector("text=Custom Report Builder")

    # 6. Check Report Level Buttons
    print("Checking Report Level Buttons...")

    # Region Level button should NOT be present
    region_btn = page.locator("button", has_text="Region Level")

    # We expect count to be 0 because we conditionally rendered it out
    if region_btn.count() == 0:
         print("PASS: Region Level button is NOT present.")
    else:
         # Double check visibility just in case
         if not region_btn.is_visible():
             print("PASS: Region Level button exists but is hidden (Acceptable).")
         else:
             print("FAIL: Region Level button IS visible.")

    district_btn = page.locator("button", has_text="District Level")
    branch_btn = page.locator("button", has_text="Branch Level")

    if district_btn.is_visible() and branch_btn.is_visible():
        print("PASS: District and Branch buttons are visible.")
    else:
        print("FAIL: District/Branch buttons missing.")

    # 7. Verify Data Filtering (via Console State)
    print("Verifying Data Filtering...")

    # Evaluate state to check rawData rows vs what getAggregatedReportData returns
    filtered_count = page.evaluate("""
        () => {
            const rows = getAggregatedReportData('BRANCH', true); // Plan data
            return rows.length;
        }
    """)

    print(f"Filtered Branch Count: {filtered_count}")

    # 'PUTTA PRASAD' has 4 branches in TSV data (KADIRI, DHARMAVARAM, BUDWAL, KADAPA)
    if filtered_count == 4:
        print("PASS: Data filtering is correct (4 branches).")
    else:
        print(f"FAIL: Expected 4 branches, got {filtered_count}.")

    # Check if we can find other branches?
    all_count = page.evaluate("state.rawData.rows.length")
    print(f"Total Rows in State: {all_count}")

    # Take Screenshot
    page.screenshot(path="verification/dm_reports_view.png")
    print("Screenshot saved to verification/dm_reports_view.png")

    # 8. Verify CEO Access (Quick Check)
    print("Reloading for CEO Check...")
    page.reload()

    page.wait_for_selector("#login-btn-ceo")
    page.click("#login-btn-ceo")

    # CEO Auto-logins to dashboard
    page.wait_for_selector(".main-content:not(.hidden)")

    page.click("#nav-reports")
    page.wait_for_selector("text=Custom Report Builder")

    region_btn_ceo = page.locator("button", has_text="Region Level")
    if region_btn_ceo.is_visible():
        print("PASS: Region Level button visible for CEO.")
    else:
        print("FAIL: Region Level button missing for CEO.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
