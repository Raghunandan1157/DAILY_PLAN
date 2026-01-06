
from playwright.sync_api import sync_playwright

def verify_form_title():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        import os
        cwd = os.getcwd()
        page.goto(f'file://{cwd}/index.html')
        page.evaluate('openBranchModal("KADIRI")')

        # Get text of the form section title
        # There might be multiple .form-section-title elements
        titles = page.locator('.form-section-title').all_text_contents()
        print('Form Section Titles:', titles)

        browser.close()

if __name__ == '__main__':
    verify_form_title()
