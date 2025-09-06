# Technical Development Guidelines: SalesPulse CAP Project

This document provides specific technical instructions for the AI.

## 1. Naming Conventions & Structure

* **CDS Namespace:** `com.sap.salespulse`
* **CDS Entities/Services:** `PascalCase` (e.g., `SalesOrders`, `SalesService`)
* **JavaScript:** `camelCase` (e.g., `onUpload`)
* **UI Module Name:** `salespulse-ui`

## 2. CAP Backend Specifications

* **Data Model (`db/schema.cds`):**
    * Entity `SalesOrders` must use `cuid` and `managed` aspects.
    * Fields: `OrderID` (String), `Region` (String), `Country` (String), `Product` (String), `Revenue` (Decimal), `OrderDate` (Date).
* **Service (`srv/service.cds`):**
    * Service must be named `SalesService`.
    * Expose `SalesOrders` as a projection.
* **Custom Logic (`srv/service.js`):**
    * Implement an unbound action named `uploadExcel`.
    * Use the `xlsx` npm package for parsing.
    * The logic must perform a transactional `INSERT` into the `SalesOrders` entity.
    * Return a success message on completion.

## 3. SAPUI5 Frontend Specifications

* **View Type:** Use **XML views**.
* **Controls:** Use `sap.m` and `sap.ui.unified` libraries.
* **Data Binding:** The main table's `items` property must be bound to `/SalesOrders`.
* **File Upload Logic:**
    * Use a `FileReader` to read the file content.
    * Make a `POST` request to `/odata/v4/sales-service/uploadExcel`.
    * `Content-Type` must be `application/json`.
    * Request body must be `{ "excel": fileContent }`.
* **User Feedback:** Use `sap.m.MessageToast`. Do not use `alert()`.