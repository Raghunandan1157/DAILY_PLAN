from playwright.sync_api import sync_playwright

def verify_combined_report():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (make sure server is running on 8000)
        page.goto("http://localhost:8000")

        # Wait for script to load
        page.wait_for_load_state('networkidle')

        # Inject mock data into state.branchDetails and generate report
        # We will bypass the UI and call the function directly to verify the output HTML structure

        js_code = """
        async () => {
            // Mock Data
            const mockPlan = [
                {
                    name: "BRANCH_A",
                    data: {
                        ftod_plan: 1000,
                        nov_25_Slipped_Accounts_Plan: 500,
                        pnpa_plan: 200,
                        npa_activation: 10,
                        npa_closure: 5,
                        fy_od_plan: 300,
                        fy_non_start_plan: 100,
                        disb_igl_acc: 50,
                        disb_igl_amt: 5000000,
                        disb_il_acc: 20,
                        disb_il_amt: 2000000,
                        kyc_fig_igl: 10,
                        kyc_il: 5,
                        kyc_npa: 2
                    }
                }
            ];

            const mockAchieve = [
                {
                    name: "BRANCH_A",
                    data: {
                        ftod_actual: 800,
                        nov_25_Slipped_Accounts_Actual: 400,
                        pnpa_actual: 150,
                        npa_activation: 12,
                        npa_closure: 4,
                        fy_od_acc: 250,
                        fy_non_start_acc: 80,
                        disb_igl_acc: 40,
                        disb_igl_amt: 4000000,
                        disb_il_acc: 15,
                        disb_il_amt: 1500000,
                        kyc_fig_igl: 8,
                        kyc_il: 4,
                        kyc_npa: 1
                    }
                }
            ];

            // Generate HTML
            const html = generateCombinedReportHTML("TEST REPORT", "BRANCH", mockPlan, mockAchieve);

            // Render to body for screenshot
            document.body.innerHTML = html;
            document.body.style.background = "white";
        }
        """

        page.evaluate(js_code)

        # Screenshot
        page.screenshot(path="verification/combined_report.png", full_page=True)
        print("Screenshot saved to verification/combined_report.png")

        browser.close()

if __name__ == "__main__":
    verify_combined_report()
