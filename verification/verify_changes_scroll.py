
from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the index.html file directly
        import os
        cwd = os.getcwd()
        page.goto(f'file://{cwd}/index.html')

        # Trigger openBranchModal('KADIRI')
        page.evaluate('openBranchModal("KADIRI")')

        # Wait for modal visibility
        page.wait_for_selector('#branchModal.visible')

        # Scroll down inside the modal body to reveal the FY section
        # The modal body class is .modal-body
        page.evaluate('document.querySelector(".modal-body").scrollTop = 500')

        # Take screenshot of the modal
        page.screenshot(path='verification/modal_change_scrolled.png')

        browser.close()

if __name__ == '__main__':
    verify_changes()
