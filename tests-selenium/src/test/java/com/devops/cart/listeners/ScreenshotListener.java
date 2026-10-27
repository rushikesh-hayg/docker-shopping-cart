package com.devops.cart.listeners;

import com.devops.cart.base.BaseTest;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

/**
 * TestNG Listener that automatically captures full-page browser screenshots
 * whenever an assertion or element lookup fails.
 */
public class ScreenshotListener implements ITestListener {

    @Override
    public void onTestStart(ITestResult result) {
        System.out.println("⏳ [TEST STARTED]: " + result.getMethod().getMethodName());
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        System.out.println("✅ [TEST PASSED]: " + result.getMethod().getMethodName());
    }

    @Override
    public void onTestFailure(ITestResult result) {
        String testName = result.getMethod().getMethodName();
        System.err.println("❌ [TEST FAILED]: " + testName + " | Cause: " + result.getThrowable().getMessage());
        
        // Trigger automated screenshot
        String path = BaseTest.takeScreenshot(testName);
        if (path != null) {
            System.err.println("📁 Failure screenshot archived at: " + path);
        }
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        System.out.println("⚠️ [TEST SKIPPED]: " + result.getMethod().getMethodName());
    }

    @Override
    public void onStart(ITestContext context) {
        System.out.println("==========================================================");
        System.out.println("🚀 Executing Selenium 4 E2E Test Suite: " + context.getName());
        System.out.println("==========================================================");
    }

    @Override
    public void onFinish(ITestContext context) {
        System.out.println("==========================================================");
        System.out.println("🏁 E2E Test Suite Complete. Passed: " + context.getPassedTests().size() 
                + ", Failed: " + context.getFailedTests().size());
        System.out.println("==========================================================");
    }
}
