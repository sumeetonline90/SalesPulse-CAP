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

        onUpload() {
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
            
            // Read file content using FileReader
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // Convert file content to base64
                    const base64Content = e.target.result.split(',')[1];
                    
                    // Prepare request data
                    const requestData = {
                        excel: base64Content
                    };

                    // Make POST request to uploadExcel action
                    fetch('/sales-service/uploadExcel', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    })
                    .then(response => {
                        if (!response.ok) {
                            return response.text().then(text => {
                                throw new Error(text || 'Upload failed');
                            });
                        }
                        return response.json();
                    })
                    .then(result => {
                        // Handle the response properly - CAP actions return JSON with the result
                        const message = result.value || result || "File uploaded successfully!";
                        MessageToast.show(message);
                        // Refresh the table data
                        this.onRefresh();
                        // Reset file uploader
                        fileUploader.clear();
                        this.byId("uploadButton").setEnabled(false);
                    })
                    .catch(error => {
                        console.error('Upload error:', error);
                        MessageToast.show("Upload failed: " + error.message);
                    });
                } catch (error) {
                    console.error('File processing error:', error);
                    MessageToast.show("Error processing file: " + error.message);
                }
            };

            reader.onerror = () => {
                MessageToast.show("Error reading file");
            };

            // Read file as data URL (base64)
            reader.readAsDataURL(file);
        },

        onUploadComplete(oEvent) {
            const response = oEvent.getParameter("response");
            if (response) {
                MessageToast.show("Upload completed: " + response);
                this.onRefresh();
            }
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
        }
    });
});