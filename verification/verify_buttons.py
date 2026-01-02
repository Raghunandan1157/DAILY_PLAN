from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Navigate to the page
    page.goto("http://localhost:8080/index.html")

    # 2. Log in as CEO
    page.click('#login-btn-ceo')

    # 3. Wait for dashboard to load
    page.wait_for_selector('#nav-dashboard.active')

    # 4. Click Reporting Tab
    page.click('#nav-reports')

    # 5. Wait for Reporting view
    page.wait_for_selector("text=Generate Plan Report")

    # 6. Verify Buttons
    plan_btn = page.get_by_role("button", name="Generate Plan Report")
    both_btn = page.get_by_role("button", name="Generate Plan & Achievement Reports")

    expect(plan_btn).to_be_visible()
    expect(both_btn).to_be_visible()

    # 7. Take Screenshot
    page.screenshot(path="verification/reports_buttons.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
