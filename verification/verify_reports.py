from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Navigate to the page
    page.goto("http://localhost:8080/index.html")

    # 2. Log in as CEO
    page.click('#login-btn-ceo')

    # 3. Wait for dashboard to load (nav-dashboard active)
    page.wait_for_selector('#nav-dashboard.active')

    # 4. Click Reporting Tab
    page.click('#nav-reports')

    # 5. Wait for Reports view
    page.wait_for_selector('button.btn-primary')

    # 6. Check for "Generate Daily Reports" button
    # The button text includes "Generate Daily Reports" and svg
    # We can search by text content
    generate_btn = page.get_by_role("button", name="Generate Daily Reports")
    expect(generate_btn).to_be_visible()

    # 7. Take Screenshot
    page.screenshot(path="verification/reports_tab.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
