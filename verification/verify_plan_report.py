from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load the page
    page.goto(f"file://{os.getcwd()}/index.html")

    # 1. Simulate CEO Login (Quick way to get to dashboard)
    print("Clicking CEO Login...")
    page.click("#login-btn-ceo")

    # Wait for UI to load
    page.wait_for_selector(".main-content:not(.hidden)")

    # 2. Switch to Reports Tab
    print("Switching to Reports Tab...")
    page.click("#nav-reports")

    # Wait for Reports UI
    page.wait_for_selector("text=Custom Report Builder")

    # 3. Click Generate Plan Report
    print("Clicking Generate Plan Report...")
    # Generate Plan Report Button

    try:
        # We can listen for console errors to catch ReferenceErrors
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        # Click the button containing "Generate Plan Report"
        page.click("button:has-text('Generate Plan Report')")

        # Wait a bit to let any potential error happen
        page.wait_for_timeout(2000)

        print("Button clicked. If no error above, it passed.")

    except Exception as e:
        print(f"Exception during click: {e}")

    # Take Screenshot of the state (should show success toast if working, or error if not)
    # The current implementation shows a toast.
    page.screenshot(path="verification/plan_report_test.png")
    print("Screenshot saved to verification/plan_report_test.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
