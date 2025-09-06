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