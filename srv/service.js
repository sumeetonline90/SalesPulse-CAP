const cds = require('@sap/cds');
const xlsx = require('xlsx');

module.exports = cds.service.impl(async function() {
    const { SalesOrders } = this.entities;

    this.on('uploadExcel', async (req) => {
        try {
            const { excel } = req.data;
            
            if (!excel) {
                req.error(400, 'No Excel data provided');
                return;
            }

            // Parse the base64 Excel data
            const buffer = Buffer.from(excel, 'base64');
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            
            // Get the first worksheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const data = xlsx.utils.sheet_to_json(worksheet);
            
            if (!data || data.length === 0) {
                req.error(400, 'No data found in Excel file');
                return;
            }

            // Validate required columns
            const requiredColumns = ['OrderID', 'Region', 'Country', 'Product', 'Revenue', 'OrderDate'];
            const firstRow = data[0];
            const missingColumns = requiredColumns.filter(col => !(col in firstRow));
            
            if (missingColumns.length > 0) {
                req.error(400, `Missing required columns: ${missingColumns.join(', ')}`);
                return;
            }

            // Transform data for insertion
            const salesOrdersData = data.map(row => ({
                OrderID: row.OrderID ? String(row.OrderID) : null,
                Region: row.Region ? String(row.Region) : null,
                Country: row.Country ? String(row.Country) : null,
                Product: row.Product ? String(row.Product) : null,
                Revenue: row.Revenue ? parseFloat(row.Revenue) : 0,
                OrderDate: row.OrderDate ? new Date(row.OrderDate) : null
            }));

            // Filter out invalid rows
            const validData = salesOrdersData.filter(row => 
                row.OrderID && row.Region && row.Country && row.Product && row.Revenue > 0 && row.OrderDate
            );

            if (validData.length === 0) {
                req.error(400, 'No valid data rows found in Excel file');
                return;
            }

            // Check for existing records and only insert new ones
            let newRecordsCount = 0;
            let skippedRecordsCount = 0;
            
            for (const record of validData) {
                // Check if record with this OrderID already exists
                const existingRecord = await cds.tx(req).run(
                    SELECT.one.from(SalesOrders).where({ OrderID: record.OrderID })
                );
                
                if (!existingRecord) {
                    // Insert new record
                    await cds.tx(req).run(
                        INSERT.into(SalesOrders).entries(record)
                    );
                    newRecordsCount++;
                } else {
                    skippedRecordsCount++;
                }
            }

            return `Upload completed: ${newRecordsCount} new records added, ${skippedRecordsCount} duplicates skipped`;

        } catch (error) {
            console.error('Error processing Excel upload:', error);
            req.error(500, `Error processing Excel file: ${error.message}`);
        }
    });

    this.on('getGeographyData', async (req) => {
        try {
            // Get aggregated data by region and country
            const geographyData = await cds.tx(req).run(
                SELECT.from(SalesOrders)
                    .columns('Region', 'Country')
                    .columns('sum(Revenue) as totalRevenue', 'count(*) as recordCount')
                    .groupBy('Region', 'Country')
                    .orderBy('totalRevenue desc')
            );

            return geographyData.map(row => ({
                region: row.Region,
                country: row.Country,
                totalRevenue: parseFloat(row.totalRevenue).toFixed(2),
                recordCount: row.recordCount
            }));

        } catch (error) {
            console.error('Error getting geography data:', error);
            req.error(500, `Error getting geography data: ${error.message}`);
        }
    });

    // Add some basic CRUD events for better error handling
    this.before('CREATE', SalesOrders, (req) => {
        // Validate revenue is positive
        if (req.data.Revenue <= 0) {
            req.error(400, 'Revenue must be greater than 0');
        }
        
        // Validate required fields
        if (!req.data.OrderID || !req.data.Region || !req.data.Country || !req.data.Product) {
            req.error(400, 'Missing required fields: OrderID, Region, Country, and Product are mandatory');
        }
    });

    this.after('READ', SalesOrders, (results) => {
        // Format revenue for display
        if (Array.isArray(results)) {
            results.forEach(order => {
                if (order.Revenue) {
                    order.Revenue = parseFloat(order.Revenue).toFixed(2);
                }
            });
        } else if (results && results.Revenue) {
            results.Revenue = parseFloat(results.Revenue).toFixed(2);
        }
    });
});
