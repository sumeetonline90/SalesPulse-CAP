using com.sap.salespulse as sp from '../db/schema';

service SalesService @(path: '/odata/v4/sales-service') {
    entity SalesOrders as projection on sp.SalesOrders;
    
    action uploadExcel(excel: String) returns String;
}
