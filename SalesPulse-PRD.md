# Product Requirements Document: SalesPulse Analytics App

### Version: 1.0

---

## 1. Vision & Objective

**Problem:** Sales managers lack a quick, unified way to analyze sales data from Excel files or the main SAP system.

**Vision:** To create "SalesPulse," a simple, web-based analytics application on SAP BTP that provides immediate insights from sales data.

## 2. Target Audience & User Persona

* **Primary User:** Sales Manager ("Sarah")
* **Goal:** Quickly understand sales performance without waiting for IT reports.
* **Need:** A self-service tool to upload her team's weekly sales data and see key metrics instantly.

## 3. Features & Requirements (MVP)

* **F-01: Data Ingestion via Excel Upload**
    * **User Story:** As Sarah, I want to upload an Excel file (`.xlsx`) to analyze data that is not yet in the main SAP system.
    * **Requirements:**
        * The UI must have a File Upload control and an "Upload" button.
        * The system must parse an Excel file with columns: `OrderID`, `Region`, `Country`, `Product`, `Revenue`, `OrderDate`.
        * Provide user feedback on success or failure.

* **F-02: Sales Data Visualization**
    * **User Story:** As Sarah, I want to see all uploaded sales data in a clear, sortable table.
    * **Requirements:**
        * Display sales data in a table with columns: Order ID, Region, Product, Revenue.
        * The table must refresh automatically after a successful data upload.
        * Data should persist in the database and be available on subsequent visits.

* **F-03: Persistent Data Storage**
    * **User Story:** As Sarah, I want my uploaded data to be saved permanently so I can access it later.
    * **Requirements:**
        * All uploaded sales data must be stored in the HANA database.
        * Data should be available when the user visits the app again.
        * Previous data should not be lost when new data is uploaded.

* **F-04: CRUD Operations for Sales Data**
    * **User Story:** As Sarah, I want to create, update, and delete individual sales records as needed.
    * **Requirements:**
        * Add functionality to create new sales records manually.
        * Allow editing of existing sales records in the table.
        * Provide delete functionality for individual records.
        * All changes should be immediately reflected in the database.

* **F-05: Duplicate Data Handling**
    * **User Story:** As Sarah, I want to avoid duplicate records when uploading new Excel files.
    * **Requirements:**
        * When uploading new Excel data, check for existing records with the same Order ID.
        * Skip records that already exist in the database (ignore duplicates).
        * Only add new records that don't already exist.
        * Provide feedback on how many new records were added vs. skipped.

* **F-06: Geography-wise Volume Distribution Chart**
    * **User Story:** As Sarah, I want to see a visual representation of sales volume by geography.
    * **Requirements:**
        * Display a pie chart showing revenue distribution by region/country.
        * Chart should update automatically when data changes.
        * Chart should be interactive with hover effects showing exact values.
        * Chart should be responsive and work on different screen sizes.