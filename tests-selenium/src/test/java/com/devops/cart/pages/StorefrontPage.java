package com.devops.cart.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class StorefrontPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    // Locators
    private final By brandLogo = By.id("brand-logo");
    private final By backendHealthText = By.id("backend-health-text");
    private final By searchInput = By.id("search-input");
    private final By catalogCount = By.id("catalog-count");
    private final By productCards = By.cssSelector(".product-card");
    private final By addToCartButtons = By.cssSelector(".add-to-cart-btn");
    private final By cartToggleBtn = By.id("cart-drawer-toggle");
    private final By cartCounter = By.id("cart-counter");
    private final By cartDrawer = By.id("cart-drawer");
    private final By drawerOpenCheckoutBtn = By.id("open-checkout-modal-btn");
    
    // Checkout Modal
    private final By checkoutModal = By.id("checkout-modal");
    private final By custNameInput = By.id("cust-name");
    private final By custEmailInput = By.id("cust-email");
    private final By submitOrderBtn = By.id("submit-order-btn");
    
    // Success Modal
    private final By successModal = By.id("success-modal");
    private final By orderReceiptContent = By.id("order-receipt-content");
    private final By successDismissBtn = By.id("success-dismiss-btn");
    
    // Admin Navigation
    private final By navAdminBtn = By.id("nav-admin-btn");
    private final By statRevenue = By.id("stat-revenue");
    private final By statOrders = By.id("stat-orders");

    public StorefrontPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    public void open(String url) {
        driver.get(url);
        wait.until(ExpectedConditions.visibilityOfElementLocated(brandLogo));
    }

    public String getPageTitle() {
        return driver.getTitle();
    }

    public String getBackendHealthStatus() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(backendHealthText)).getText();
    }

    public int getCatalogProductCount() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(productCards));
        List<WebElement> cards = driver.findElements(productCards);
        return cards.size();
    }

    public void searchProduct(String query) {
        WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(searchInput));
        input.clear();
        input.sendKeys(query);
        // Wait for debounce and grid re-render
        try { Thread.sleep(600); } catch (InterruptedException ignored) {}
    }

    public void filterByCategory(String category) {
        By pillLocator = By.cssSelector(".pill-btn[data-category='" + category + "']");
        WebElement pill = wait.until(ExpectedConditions.elementToBeClickable(pillLocator));
        pill.click();
        try { Thread.sleep(400); } catch (InterruptedException ignored) {}
    }

    public void addFirstAvailableItemToCart() {
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(addToCartButtons));
        btn.click();
    }

    public int getCartBadgeCount() {
        WebElement counter = wait.until(ExpectedConditions.visibilityOfElementLocated(cartCounter));
        return Integer.parseInt(counter.getText().trim());
    }

    public void openCartDrawer() {
        wait.until(ExpectedConditions.elementToBeClickable(cartToggleBtn)).click();
        wait.until(ExpectedConditions.attributeContains(cartDrawer, "class", "open"));
    }

    public void proceedToCheckout() {
        wait.until(ExpectedConditions.elementToBeClickable(drawerOpenCheckoutBtn)).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(checkoutModal));
    }

    public void fillCheckoutDetailsAndPay(String name, String email) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(custNameInput)).sendKeys(name);
        driver.findElement(custEmailInput).sendKeys(email);
        driver.findElement(submitOrderBtn).click();
    }

    public boolean isOrderReceiptDisplayed() {
        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(successModal));
        WebElement receipt = wait.until(ExpectedConditions.visibilityOfElementLocated(orderReceiptContent));
        return modal.isDisplayed() && receipt.getText().contains("Order ID");
    }

    public void dismissSuccessModal() {
        wait.until(ExpectedConditions.elementToBeClickable(successDismissBtn)).click();
    }

    public void navigateToAdmin() {
        wait.until(ExpectedConditions.elementToBeClickable(navAdminBtn)).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(statRevenue));
    }

    public String getAdminTotalRevenue() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(statRevenue)).getText();
    }

    public int getAdminTotalOrders() {
        String orders = wait.until(ExpectedConditions.visibilityOfElementLocated(statOrders)).getText().trim();
        return Integer.parseInt(orders);
    }
}
