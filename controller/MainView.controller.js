sap.ui.define([
    'jquery.sap.global',
    "sap/dm/dme/podfoundation/controller/PluginViewController",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
], function (jQuery, PluginViewController, MessageToast, MessageBox) {
    "use strict";
    var gOperationPhase = {};
    var g_sw_execute = false;
    const ENDPOINTS = {
        PP_NOTIFICATION: "/pe/api/v1/process/processDefinitions/start?key=REG_6485e379-84de-483f-9d4d-e4ad9991e69a"
    };
    return PluginViewController.extend("serviacero.custom.plugins.zpluginscrap.controller.MainView", {

        onInit: function () {
            PluginViewController.prototype.onInit.apply(this, arguments);
        },

        onAfterRendering: function () {
            this.getData();
        },

        onBeforeRendering: function () {
            this.subscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.subscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
            this.subscribe("phaseSelectionEvent", this.onPhaseSelectionEventCustom, this);

            // Defer publish calls to avoid firing event handlers during the rendering phase
            setTimeout(function () {
                this.publish("requestForPhaseData", { "source": this, "sendToAllPages": true });
                this.publish("requestForOperationData", { "source": this, "sendToAllPages": true });
            }.bind(this), 0);
        },


        isSubscribingToNotifications: function () {
            return true;
        },

        getCustomNotificationEvents: function () { },

        getNotificationMessageHandler: function () {
            return null;
        },

        _handleNotificationMessage: function () { },

        onPodSelectionChangeEvent: function (sChannelId, sEventId, oData) {
            if (this.isEventFiredByThisPlugin(oData)) return;
        },

        onPhaseSelectionEventCustom: function (sChannelId, sEventId, oData) {
            if (this.isEventFiredByThisPlugin(oData)) return;
            gOperationPhase = oData;
            if (typeof this.getOperationActivityCustomValue === "function") {
                this.getOperationActivityCustomValue();
            }
        },

        onOperationChangeEvent: function (sChannelId, sEventId, oData) {
            if (this.isEventFiredByThisPlugin(oData)) return;
        },

        onWorkListSelectEvent: function (sChannelId, sEventId, oData) {
            if (this.isEventFiredByThisPlugin(oData)) return;
        },

        handleYieldOrScrapReportedHabilitados: function (sChannelId, sEventId, oData) {
            if (this.isEventFiredByThisPlugin(oData)) return;
        },

        // ============================================================
        // GET DATA (SELECT)
        // ============================================================

        getData: function () {
            let fechaActual = this.obtenerFechaActual();

            let activityConfirmationData = {
                "inConfirmActivities": true,
                "inOperationActivity": this.getPodSelectionModel().getOperation().operation,
                "inEndDateTime": fechaActual,
                "inLoteCompleto": true,
                "inOperationActivityVersion": this.getPodSelectionModel().getOperations()[0].recipeArray[0].ref.split(",")[3],
                "inStepId": this.getPodSelectionModel().getOperation().stepId,
            };

            let parameters = {
                "in_mov101_slitter_full": false,
                "inPiezas": 0,
                "inUsuario": this.getPodController().getUserId(),
                "in_mov531_matnr": "000000000000000000",
                "inPesoBascula": 0,
                "inMetros": 0,
                "activityConfirmationData": activityConfirmationData,
                "inLoteCompleto": true,
                "inWorkCenter": this.getPodSelectionModel().getSelectedPhaseWorkCenter(),
                "in_num_order": this.getPodSelectionModel().getShopOrder(),
                "inConfirmActivities": true,
                "inPlant": this.getPodController().getUserPlant(),
                "in_mov531_pzas": 0,

                // SELECT
                "sw_r2_execute": false,
                "sw_r2_insert": false,
                "sw_r2_stock_zero": false,
                "sw_r2_select": false,

                "sw_mov101": false,
                "sw_mov261": false,
                "sw_mov531": false,
                "sw_mov531_select": true,

                "Json_slitter": "[]"
            };

            g_sw_execute = false;

            let url = this.getPublicApiRestDataSourceUri() + ENDPOINTS.PP_NOTIFICATION + "&async=false";
            this.callProductionProcess(url, parameters, this);
        },

        // ============================================================
        // EXECUTE PROCESS (NO SELECT)
        // ============================================================

        executeProcess: function () {
            let fechaActual = this.obtenerFechaActual();

            let activityConfirmationData = {
                "inConfirmActivities": true,
                "inOperationActivity": this.getPodSelectionModel().getOperation().operation,
                "inEndDateTime": fechaActual,
                "inLoteCompleto": true,
                "inOperationActivityVersion": this.getPodSelectionModel().getOperations()[0].recipeArray[0].ref.split(",")[3],
                "inStepId": this.getPodSelectionModel().getOperation().stepId,
            };

            let w_table = this.getView().byId("tableBatchesSaldos");
            let w_items = w_table.getSelectedItems();
            let w_array = [];
            let w_jsonSplitter = [];

            if (w_items.length > 0) {
                w_items.forEach(function (item) {
                    const cells = item.getCells();
                    w_array.push({
                        order: cells[0].getText(),
                        material: cells[1].getText(),
                        erpSequence: cells[4].getText(),
                        operationActivity: cells[5].getText(),
                        quantity: cells[6].getValue(),
                        sujeto_lote: cells[7].getText(),
                        um: cells[8].getText(),
                        sfc: cells[9].getText(),
                        cuantos_etiqueta: cells[10].getValue() // 20260611
                    });
                });

                w_jsonSplitter = w_array.map(item => JSON.stringify({
                    order: item.order || "",
                    material: item.material || "",
                    erpSequence: item.erpSequence || "",
                    operationActivity: item.operationActivity || "",
                    quantity: item.quantity || 0,
                    sujeto_lote: item.sujeto_lote || "",
                    um: item.um || "",
                    sfc: item.sfc || "",
                    cuantos_etiqueta: item.cuantos_etiqueta || 0 // 20260611
                }));
            }

            let parameters = {
                "in_mov101_slitter_full": false,
                "inPiezas": 0,
                "inUsuario": this.getPodController().getUserId(),
                "in_mov531_matnr": "000000000000000000",
                "inPesoBascula": 0,
                "inMetros": 0,
                "activityConfirmationData": activityConfirmationData,
                "inLoteCompleto": true,
                "inWorkCenter": this.getPodSelectionModel().getSelectedPhaseWorkCenter(),
                "in_num_order": this.getPodSelectionModel().getShopOrder(),
                "inConfirmActivities": true,
                "inPlant": this.getPodController().getUserPlant(),
                "in_mov531_pzas": 0,

                // EXECUTE
                "sw_r2_execute": false,
                "sw_r2_insert": false,
                "sw_r2_stock_zero": false,
                "sw_r2_select": false,

                "sw_mov101": false,
                "sw_mov261": false,
                "sw_mov531": true,
                "sw_mov531_select": false,

                "Json_slitter": JSON.stringify(w_jsonSplitter)
            };

            g_sw_execute = true;

            let url = this.getPublicApiRestDataSourceUri() + ENDPOINTS.PP_NOTIFICATION + "&async=false";
            this.callProductionProcess(url, parameters, this);
        },

        // ============================================================
        // CALL PRODUCTION PROCESS (DM‑SAFE BUSY + RESET)
        // ============================================================

        callProductionProcess: function (url, parameters, oThis) {
            var oContainer = oThis.getView().byId("vBoxSaldos");
            oContainer.setBusy(true);
            // Defer applyChanges to avoid calling it during a rendering phase
            setTimeout(function () { sap.ui.getCore().applyChanges(); }, 0);

            try {
                oThis.ajaxPostRequest(
                    url,
                    parameters,

                    // SUCCESS
                    function (oResponseData) {

                        let data = oResponseData.o_array_select || [];
                        let realData = data.length > 0 ? data : null;

                        // SOLO actualizar tabla cuando es SELECT
                        if (parameters.sw_mov531_select === true && realData) {
                            let oModel = new sap.ui.model.json.JSONModel();
                            oModel.setData(JSON.parse(JSON.stringify(realData)));
                            oThis.getView().setModel(oModel, "items");
                        }

                        // 🔥 Delay DM‑safe para permitir que el busy se vea
                        setTimeout(() => {
                            oContainer.setBusy(false);
                        }, 120);

                        let w_mensaje = oResponseData.o_message;
                        let w_sw_error = oResponseData.o_sw_error;

                        if (w_sw_error) {
                            if (g_sw_execute) MessageBox.error(w_mensaje);
                            else MessageToast.show(w_mensaje);

                        } else {

                            if (g_sw_execute) {
                                MessageBox.success(w_mensaje);

                                // 🔥 Deseleccionar filas
                                let oTable = oThis.getView().byId("tableBatchesSaldos");
                                oTable.removeSelections(true);

                                // 🔥 Resetear cantidades
                                let oModel = oThis.getView().getModel("items");
                                if (oModel) {
                                    let data = oModel.getData();
                                    data.forEach(item => item.quantity = "0");
                                    oModel.refresh(true);
                                }

                            } else {
                                MessageToast.show(w_mensaje);
                            }
                        }
                    },

                    // ERROR
                    function (oError, sHttpErrorMessage) {
                        MessageToast.show(oError || sHttpErrorMessage);

                        setTimeout(() => {
                            oContainer.setBusy(false);
                        }, 120);
                    }
                );

            } catch (error) {
                MessageToast.show(
                    oThis.getView().getModel("i18n").getResourceBundle().getText("mensajeErrorGenerico")
                );

                setTimeout(() => {
                    oContainer.setBusy(false);
                }, 120);
            }
        },

        // ============================================================
        // FECHA
        // ============================================================

        obtenerFechaActual: function () {
            var now = new Date();
            var offsetMin = 0;
            now = new Date(now.getTime() - offsetMin * 60000);

            var dia = String(now.getDate()).padStart(2, '0');
            var mes = String(now.getMonth() + 1).padStart(2, '0');
            var anio = now.getFullYear();
            var hora = String(now.getHours()).padStart(2, '0');
            var minuto = String(now.getMinutes()).padStart(2, '0');
            var segundo = String(now.getSeconds()).padStart(2, '0');

            return anio + "." + mes + "." + dia + " " + hora + ":" + minuto + ":" + segundo;
        },

        // ============================================================
        // INPUT DECIMAL
        // ============================================================

        onQuantityChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oInput.getValue();
            var sTarget = oInput.data("targetProperty"); // 20260611

            var sDecimal;
            try {
                var oCore = sap.ui.getCore();
                if (oCore && oCore.getConfiguration) {
                    sDecimal = oCore.getConfiguration().getFormatSettings().getNumberSymbol("decimal");
                }
            } catch (e) {
                sDecimal = null;
            }

            if (!sDecimal) {
                sDecimal = (1.1).toLocaleString().substring(1, 2);
                if (sDecimal !== "." && sDecimal !== ",") sDecimal = ".";
            }

            var sWrongDecimal = sDecimal === "." ? "," : ".";

            sValue = sValue.replace(new RegExp("\\" + sWrongDecimal, "g"), sDecimal);

            var regexAllowed = new RegExp("[^0-9\\" + sDecimal + "]", "g");
            sValue = sValue.replace(regexAllowed, "");

            if (sValue.endsWith(sDecimal)) {
                var count = (sValue.match(new RegExp("\\" + sDecimal, "g")) || []).length;
                if (count === 1) {
                    oInput.setValue(sValue);
                    return;
                }
            }

            var parts = sValue.split(sDecimal);
            if (parts.length > 2) {
                sValue = parts[0] + sDecimal + parts[1];
                parts = sValue.split(sDecimal);
            }

            if (parts[0].length > 4) parts[0] = parts[0].substring(0, 4);
            if (parts[1] && parts[1].length > 2) parts[1] = parts[1].substring(0, 2);

            sValue = parts.join(sDecimal);
            oInput.setValue(sValue);

            var oCtx = oInput.getBindingContext("items");
            if (oCtx && sTarget) { // 20260611
                //	if (oCtx) { // 20260611
                //		oCtx.getModel().setProperty(oCtx.getPath() + "/quantity", sValue); // 20260611
                oCtx.getModel().setProperty(oCtx.getPath() + "/" + sTarget, sValue); // 20260611
            }
        },
        onExit: function () {
            PluginViewController.prototype.onExit.apply(this, arguments);

            this.unsubscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.unsubscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.unsubscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
            this.unsubscribe("phaseSelectionEvent", this.onPhaseSelectionEventCustom, this);
        }

    });
});
