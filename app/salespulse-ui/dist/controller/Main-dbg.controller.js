sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/DatePicker",
    "sap/m/Select",
    "sap/ui/core/Item"
], (Controller, MessageToast, MessageBox, JSONModel, Dialog, Button, Input, DatePicker, Select, Item) => {
    "use strict";

    return Controller.extend("com.sap.salespulse.salespulseui.controller.Main", {
        onInit() {
            // Initialize the model for the view
            this.getView().setModel(new JSONModel(), "viewModel");
            
            // Load initial data when the app starts
            this.refreshSalesData();
            this.refreshChart();
        },

        onFileChange(oEvent) {
            const fileUploader = this.byId("fileUploader");
            const domRef = fileUploader.getDomRef();
            const fileInput = domRef.querySelector('input[type="file"]');
            const uploadButton = this.byId("uploadButton");
            
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                // Enable upload button when file is selected
                uploadButton.setEnabled(true);
                MessageToast.show("File selected: " + file.name);
            } else {
                uploadButton.setEnabled(false);
            }
        },

               async onUpload(oEvent) {
                   // Prevent any default form submission behavior
                   if (oEvent && oEvent.preventDefault) {
                       oEvent.preventDefault();
                   }
                   if (oEvent && oEvent.stopPropagation) {
                       oEvent.stopPropagation();
                   }
                   const fileUploader = this.byId("fileUploader");
                   const domRef = fileUploader.getDomRef();
                   const fileInput = domRef.querySelector('input[type="file"]');

                   if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                       MessageToast.show("Please select a file first");
                       return;
                   }

                   const file = fileInput.files[0];

                   // Validate file type
                   if (!file.name.toLowerCase().endsWith('.xlsx')) {
                       MessageToast.show("Please select an Excel file (.xlsx)");
                       return;
                   }

                   // Show loading state
                   MessageToast.show("Uploading file...");

                   try {
                       // Read file content using FileReader
                       const base64Content = await this.readFileAsBase64(file);

                    // Fetch CSRF token via approuter relative path
                    const csrfHead = await fetch('/odata/v4/sales-service/', {
                        method: 'HEAD',
                        headers: { 'x-csrf-token': 'Fetch' },
                        credentials: 'include'
                    });
                       const csrfToken = csrfHead.headers.get('x-csrf-token');

                       if (!csrfToken) {
                           throw new Error('Failed to fetch CSRF token');
                       }

                    // Post upload to approuter-relative backend route
                    const response = await fetch('/odata/v4/sales-service/uploadExcel', {
                           method: 'POST',
                           headers: {
                               'Content-Type': 'application/json',
                               'Accept': 'application/json',
                               'x-csrf-token': csrfToken
                           },
                           credentials: 'include',
                           body: JSON.stringify({
                               excel: base64Content
                           })
                       });

                       if (!response.ok) {
                           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                       }

                       const result = await response.json();
                       const message = result.value || result || "File uploaded successfully!";
                       MessageToast.show(message);

                       // Clear the table immediately to show that old data is being replaced
                       const salesTable = this.byId("salesTable");
                       if (salesTable) {
                           salesTable.removeAllItems();
                       }

                       // Refresh the table data with a small delay to ensure backend processing is complete
                       setTimeout(() => {
                           this.refreshSalesData();
                       }, 1500);

                       // Reset file uploader
                       fileUploader.clear();
                       this.byId("uploadButton").setEnabled(false);

                   } catch (error) {
                       console.error('Upload error:', error);
                       MessageToast.show("Upload failed: " + error.message);
                   }
               },

        readFileAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        // Convert file content to base64
                        const base64Content = e.target.result.split(',')[1];
                        resolve(base64Content);
                    } catch (error) {
                        reject(new Error('Error processing file: ' + error.message));
                    }
                };
                reader.onerror = () => {
                    reject(new Error('Error reading file'));
                };
                // Read file as data URL (base64)
                reader.readAsDataURL(file);
            });
        },


        onTypeMissmatch(oEvent) {
            MessageToast.show("Please select an Excel file (.xlsx)");
        },

        onRefresh() {
            this.refreshSalesData();
        },

        async onAddSampleData() {
            try {
                const oModel = this.getView().getModel();
                const response = await oModel.callFunction("/addSampleData");
                
                if (response) {
                    MessageToast.show(response);
                    await this.refreshSalesData();
                    await this.refreshChart();
                }
            } catch (error) {
                console.error('Error adding sample data:', error);
                MessageToast.show("Error adding sample data: " + error.message);
            }
        },

        async refreshSalesData() {
            try {
                const oModel = this.getView().getModel();
                const salesTable = this.byId("salesTable");
                
                if (oModel && salesTable) {
                    // Clear any existing data in the table first
                    salesTable.removeAllItems();
                    
                    // Refresh the OData model without parameters
                    await oModel.refresh();
                    
                    // Get the binding and refresh it
                    const binding = salesTable.getBinding("items");
                    if (binding) {
                        // Refresh the binding without parameters
                        binding.refresh();
                        
                        // Data will be loaded automatically by the binding refresh
                        // No need to show additional messages as the table will display the data
                    }
                } else {
                    MessageToast.show("Error: Unable to refresh data - model or table not found");
                }
            } catch (error) {
                console.error('Error refreshing sales data:', error);
                MessageToast.show("Error refreshing data: " + error.message);
            }
        },

        // CRUD Operations
        onCreateOrder() {
            this._showOrderDialog();
        },

        onEditOrder(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                const orderData = oBindingContext.getObject();
                this._showOrderDialog(orderData);
            }
        },

        onDeleteOrder(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                const orderData = oBindingContext.getObject();
                MessageBox.confirm(
                    `Are you sure you want to delete order ${orderData.OrderID}?`,
                    {
                        title: "Delete Order",
                        onClose: (oAction) => {
                            if (oAction === MessageBox.Action.OK) {
                                this._deleteOrder(orderData);
                            }
                        }
                    }
                );
            }
        },

        _showOrderDialog(orderData = null) {
            const isEdit = !!orderData;
            const dialog = new Dialog({
                title: isEdit ? "Edit Order" : "Create New Order",
                contentWidth: "500px",
                content: [
                    new Input({
                        id: "orderIdInput",
                        placeholder: "Order ID",
                        value: orderData?.OrderID || "",
                        enabled: !isEdit
                    }),
                    new Input({
                        id: "regionInput",
                        placeholder: "Region",
                        value: orderData?.Region || ""
                    }),
                    new Input({
                        id: "countryInput",
                        placeholder: "Country",
                        value: orderData?.Country || ""
                    }),
                    new Input({
                        id: "productInput",
                        placeholder: "Product",
                        value: orderData?.Product || ""
                    }),
                    new Input({
                        id: "revenueInput",
                        placeholder: "Revenue",
                        value: orderData?.Revenue || "",
                        type: "Number"
                    }),
                    new DatePicker({
                        id: "orderDateInput",
                        placeholder: "Order Date",
                        value: orderData?.OrderDate || new Date()
                    })
                ],
                beginButton: new Button({
                    text: isEdit ? "Update" : "Create",
                    type: "Emphasized",
                    press: () => {
                        this._saveOrder(orderData);
                        dialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: () => dialog.close()
                })
            });

            dialog.open();
        },

        async _saveOrder(existingOrder) {
            try {
                const orderId = this.byId("orderIdInput").getValue();
                const region = this.byId("regionInput").getValue();
                const country = this.byId("countryInput").getValue();
                const product = this.byId("productInput").getValue();
                const revenue = parseFloat(this.byId("revenueInput").getValue());
                const orderDate = this.byId("orderDateInput").getValue();

                if (!orderId || !region || !country || !product || !revenue || !orderDate) {
                    MessageToast.show("Please fill in all fields");
                    return;
                }

                const orderData = {
                    OrderID: orderId,
                    Region: region,
                    Country: country,
                    Product: product,
                    Revenue: revenue,
                    OrderDate: orderDate
                };

                const oModel = this.getView().getModel();
                if (existingOrder) {
                    // Update existing order
                    await oModel.update(`/SalesOrders(${existingOrder.ID})`, orderData);
                    MessageToast.show("Order updated successfully");
                } else {
                    // Create new order
                    await oModel.create("/SalesOrders", orderData);
                    MessageToast.show("Order created successfully");
                }

                await this.refreshSalesData();
                await this.refreshChart();

            } catch (error) {
                console.error('Error saving order:', error);
                MessageToast.show("Error saving order: " + error.message);
            }
        },

        async _deleteOrder(orderData) {
            try {
                const oModel = this.getView().getModel();
                await oModel.remove(`/SalesOrders(${orderData.ID})`);
                MessageToast.show("Order deleted successfully");
                await this.refreshSalesData();
                await this.refreshChart();
            } catch (error) {
                console.error('Error deleting order:', error);
                MessageToast.show("Error deleting order: " + error.message);
            }
        },

        // Chart Operations
        async onRefreshChart() {
            await this.refreshChart();
        },

        async refreshChart() {
            try {
                const oModel = this.getView().getModel();
                const response = await oModel.callFunction("/getGeographyData");
                
                if (response && response.length > 0) {
                    this._renderPieChart(response);
                } else {
                    this._showNoDataMessage();
                }
            } catch (error) {
                console.error('Error refreshing chart:', error);
                this._showNoDataMessage();
            }
        },

        _renderPieChart(data) {
            // Simple pie chart implementation using HTML/CSS/JS
            const chartContainer = document.getElementById('chartContainer');
            if (!chartContainer) return;

            const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.totalRevenue), 0);
            
            let chartHTML = '<div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; height: 100%;">';
            
            data.forEach((item, index) => {
                const percentage = ((parseFloat(item.totalRevenue) / totalRevenue) * 100).toFixed(1);
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
                const color = colors[index % colors.length];
                
                chartHTML += `
                    <div style="display: flex; flex-direction: column; align-items: center; margin: 10px; padding: 15px; border-radius: 10px; background: ${color}20; border: 2px solid ${color}; min-width: 120px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}; margin-bottom: 8px;"></div>
                        <div style="font-weight: bold; font-size: 14px; color: #333; text-align: center;">${item.region}</div>
                        <div style="font-size: 12px; color: #666; text-align: center;">${item.country}</div>
                        <div style="font-weight: bold; font-size: 16px; color: #333; margin-top: 5px;">$${item.totalRevenue}</div>
                        <div style="font-size: 12px; color: #666;">${percentage}%</div>
                        <div style="font-size: 10px; color: #888;">${item.recordCount} orders</div>
                    </div>
                `;
            });
            
            chartHTML += '</div>';
            chartContainer.innerHTML = chartHTML;
        },

        _showNoDataMessage() {
            const chartContainer = document.getElementById('chartContainer');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">No Data Available</div>
                        <div style="font-size: 14px; text-align: center;">Upload some sales data to see the geography distribution chart</div>
                    </div>
                `;
            }
        }
    });
});