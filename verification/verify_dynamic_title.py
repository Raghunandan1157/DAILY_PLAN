
from playwright.sync_api import sync_playwright

def verify_title_dynamic():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        import os
        cwd = os.getcwd()
        page.goto(f'file://{cwd}/index.html')

        # We need to simulate the state where state.systemDate is set
        # Since we load local file, we might rely on default 'Today'

        # Open modal
        page.evaluate('openBranchModal("KADIRI")')

        # Get the title text
        title_text = page.locator('#slippedSectionTitle').text_content()
        print(f'Title: {title_text}')

        # Take screenshot
        page.screenshot(path='verification/dynamic_title.png')

        browser.close()

if __name__ == '__main__':
    verify_title_dynamic()
