sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageToast, JSONModel) => {
    "use strict";

    return Controller.extend("com.sap.salespulse.salespulseui.controller.Main", {
        onInit() {
            // Initialize the model for the view
            this.getView().setModel(new JSONModel(), "viewModel");
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
            const salesTable = this.byId("salesTable");
            const binding = salesTable.getBinding("items");
            if (binding) {
                binding.refresh();
                MessageToast.show("Data refreshed");
            } else {
                // If no binding exists, try to refresh the model
                const oModel = this.getView().getModel();
                if (oModel) {
                    oModel.refresh(true);
                    MessageToast.show("Model refreshed");
                }
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
        }
    });
});