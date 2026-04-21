package com.giannis.eshop.dto;

import java.math.BigDecimal;

/**
 * One data point on the admin revenue chart.
 * {@code month} is formatted as {@code YYYY-MM} so the frontend can
 * sort lexicographically and parse it with {@code new Date(month + "-01")}
 * if needed.
 */
public record RevenueByMonthResponse(String month, BigDecimal revenue) {
}
