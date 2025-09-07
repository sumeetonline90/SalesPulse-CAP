sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/odata/v4/ODataModel",
    "com/sap/salespulse/salespulseui/model/models"
], (UIComponent, ODataModel, models) => {
    "use strict";

    return UIComponent.extend("com.sap.salespulse.salespulseui.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // initialize OData model
            this._initializeODataModel();

            // enable routing
            this.getRouter().initialize();
        },

        _initializeODataModel() {
            // Get the OData model configuration from manifest
            const oManifest = this.getManifest();
            const oDataSource = oManifest["sap.app"].dataSources.mainService;
            
            // Create OData model
            const oModel = new ODataModel({
                serviceUrl: oDataSource.uri,
                operationMode: "Server",
                autoExpandSelect: true,
                earlyRequests: true
            });

            // Set the model as the default model
            this.setModel(oModel);
        }
    });
});