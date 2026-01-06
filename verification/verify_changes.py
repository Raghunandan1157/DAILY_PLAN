
from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the index.html file directly
        import os
        cwd = os.getcwd()
        page.goto(f'file://{cwd}/index.html')

        # Take a screenshot of the header
        header_element = page.locator('#headerDate')
        print(f'Header text: {header_element.text_content()}')
        page.screenshot(path='verification/header_change.png')

        # Click on a branch to open modal and see form titles
        # We need to simulate some data or state if possible, but let's try to find static text first
        # The form section title 'FY 2025-26 Accounts' is inside the branch modal

        # Trigger openBranchModal('KADIRI') - assuming KADIRI exists in defaultTSVData
        page.evaluate('openBranchModal("KADIRI")')

        # Take screenshot of the modal
        page.screenshot(path='verification/modal_change.png')

        browser.close()

if __name__ == '__main__':
    verify_changes()
