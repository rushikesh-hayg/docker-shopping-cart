package com.devops.cart.base;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.apache.commons.io.FileUtils;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.util.Date;

public abstract class BaseTest {
    protected static WebDriver driver;
    protected String appUrl;

    @BeforeClass(alwaysRun = true)
    public void setupDriver() {
        // Resolve target application URL (Jenkins parameter or local fallback)
        String envUrl = System.getenv("APP_URL");
        String propUrl = System.getProperty("app.url");
        
        if (propUrl != null && !propUrl.trim().isEmpty() && !propUrl.equals("${app.url}")) {
            this.appUrl = propUrl.trim();
        } else if (envUrl != null && !envUrl.trim().isEmpty()) {
            this.appUrl = envUrl.trim();
        } else {
            this.appUrl = "http://localhost";
        }

        System.out.println("[SELENIUM] Initializing Headless Chrome WebDriver targeting: " + this.appUrl);

        // Setup ChromeDriver automatically
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1920,1080");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--disable-extensions");

        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(20));
    }

    @AfterClass(alwaysRun = true)
    public void tearDown() {
        if (driver != null) {
            System.out.println("[SELENIUM] Terminating WebDriver session...");
            driver.quit();
        }
    }

    public static WebDriver getDriver() {
        return driver;
    }

    /**
     * Captures failure screenshot and writes to target/screenshots/
     */
    public static String takeScreenshot(String testName) {
        if (driver == null) {
            return null;
        }

        try {
            TakesScreenshot ts = (TakesScreenshot) driver;
            File source = ts.getScreenshotAs(OutputType.FILE);

            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String fileName = testName + "_" + timestamp + ".png";
            String destPath = System.getProperty("user.dir") + File.separator + "target" 
                    + File.separator + "screenshots" + File.separator + fileName;

            File destination = new File(destPath);
            destination.getParentFile().mkdirs();
            FileUtils.copyFile(source, destination);

            System.out.println("📸 [SCREENSHOT SAVED]: " + destination.getAbsolutePath());
            return destPath;
        } catch (IOException e) {
            System.err.println("❌ Failed to capture screenshot: " + e.getMessage());
            return null;
        }
    }
}
