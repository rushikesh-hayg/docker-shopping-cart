package com.devops.cart.tests;

import com.devops.cart.base.BaseTest;
import com.devops.cart.pages.StorefrontPage;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

public class ShoppingCartE2ETest extends BaseTest {
    private StorefrontPage storefrontPage;

    @BeforeClass(alwaysRun = true)
    public void setupPage() {
        storefrontPage = new StorefrontPage(driver);
    }

    @Test(priority = 1, description = "Verify Storefront Loads with Default 6 Seeded Products")
    public void testStorefrontLoadsAndCatalogItemsPresent() {
        storefrontPage.open(this.appUrl);

        // Verify Title
        String title = storefrontPage.getPageTitle();
        Assert.assertTrue(title.contains("CloudCart"), "Page title should contain CloudCart");

        // Verify Catalog Count (6 seeded items)
        int productCount = storefrontPage.getCatalogProductCount();
        Assert.assertEquals(productCount, 6, "Storefront should display exactly 6 default seeded catalog items");
    }

    @Test(priority = 2, description = "Verify Search and Category Filtering")
    public void testSearchAndCategoryFilter() {
        // Test Search
        storefrontPage.searchProduct("Docker");
        int searchResults = storefrontPage.getCatalogProductCount();
        Assert.assertTrue(searchResults >= 1, "Searching for 'Docker' should return at least 1 matching product");

        // Reset search and test Category Filter
        storefrontPage.searchProduct("");
        storefrontPage.filterByCategory("Books");
        int booksCount = storefrontPage.getCatalogProductCount();
        Assert.assertTrue(booksCount >= 1, "Category filter 'Books' should display relevant items");

        // Restore to All
        storefrontPage.filterByCategory("ALL");
        Assert.assertEquals(storefrontPage.getCatalogProductCount(), 6);
    }

    @Test(priority = 3, description = "Verify Add to Cart and Drawer Badge Updates")
    public void testAddToCartAndDrawerUpdate() {
        int initialBadge = storefrontPage.getCartBadgeCount();
        
        // Add item to cart
        storefrontPage.addFirstAvailableItemToCart();

        // Verify Cart badge incremented
        int updatedBadge = storefrontPage.getCartBadgeCount();
        Assert.assertEquals(updatedBadge, initialBadge + 1, "Cart counter badge must increment by 1");

        // Open Drawer
        storefrontPage.openCartDrawer();
    }

    @Test(priority = 4, description = "Verify Atomic Checkout and Order Confirmation Receipt")
    public void testAtomicCheckoutFlow() {
        // Proceed from open drawer to Checkout modal
        storefrontPage.proceedToCheckout();

        // Submit Checkout Form
        storefrontPage.fillCheckoutDetailsAndPay("Alex Jenkins", "alex.jenkins@cloudops.io");

        // Assert Order Receipt Confirmation
        boolean isReceiptVisible = storefrontPage.isOrderReceiptDisplayed();
        Assert.assertTrue(isReceiptVisible, "Success modal with generated Order ID must be displayed after checkout");

        // Dismiss modal
        storefrontPage.dismissSuccessModal();
    }

    @Test(priority = 5, description = "Verify Admin Dashboard Telemetry Reflects Completed Order")
    public void testAdminMetricsReflectNewOrder() {
        // Navigate to Admin Metrics tab
        storefrontPage.navigateToAdmin();

        // Verify Total Orders is at least 1
        int ordersCount = storefrontPage.getAdminTotalOrders();
        Assert.assertTrue(ordersCount >= 1, "Admin dashboard should record at least 1 settled order");

        // Verify Revenue is non-zero
        String revenue = storefrontPage.getAdminTotalRevenue();
        Assert.assertNotEquals(revenue, "$0.00", "Admin gross revenue should be greater than $0.00");
    }
}
