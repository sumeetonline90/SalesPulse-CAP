namespace com.sap.salespulse;

using { cuid, managed } from '@sap/cds/common';

entity SalesOrders : cuid, managed {
    OrderID    : String(50)  @title: 'Order ID';
    Region     : String(100) @title: 'Region';
    Country    : String(100) @title: 'Country';
    Product    : String(255) @title: 'Product';
    Revenue    : Decimal(15,2) @title: 'Revenue';
    OrderDate  : Date @title: 'Order Date';
}

// Sample data for testing
@cds.persistence.skip
entity SalesOrdersSample {
    OrderID    : String(50);
    Region     : String(100);
    Country    : String(100);
    Product    : String(255);
    Revenue    : Decimal(15,2);
    OrderDate  : Date;
}