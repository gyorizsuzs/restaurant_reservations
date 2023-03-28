sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/SimpleType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/Core",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "jquery.sap.storage",
  ],
  function (
    Controller,
    JSONModel,
    SimpleType,
    ValidateException,
    Core,
    MessageBox,
    MessageToast
  ) {
    "use strict";

    return Controller.extend("sap.ui.demo.walkthrough.controller.C", {
      onInit: function () {
        var oView = this.getView(),
          oMM = Core.getMessageManager();

        oView.setModel(new JSONModel({ name: "", email: "", message: "" }));

        oMM.registerObject(oView.byId("nameInput"), true);
        oMM.registerObject(oView.byId("emailInput"), true);
        oMM.registerObject(oView.byId("messageInput"), true);
      },

      _validateInput: function (oInput) {
        var sValueState = "None";
        var bValidationError = false;
        var oBinding = oInput.getBinding("value");

        try {
          oBinding.getType().validateValue(oInput.getValue());
        } catch (oException) {
          sValueState = "Error";
          bValidationError = true;
        }

        oInput.setValueState(sValueState);

        return bValidationError;
      },

      onNameChange: function (oEvent) {
        var oInput = oEvent.getSource();
        this._validateInput(oInput);
      },

      onSubmit: function () {
        var oView = this.getView(),
          aInputs = [
            oView.byId("nameInput"),
            oView.byId("emailInput"),
            oView.byId("messageInput"),
          ],
          bValidationError = false;

        aInputs.forEach(function (oInput) {
          bValidationError = this._validateInput(oInput) || bValidationError;
        }, this);

        if (!bValidationError) {
          var oFormData = {
            name: oView.getModel().getProperty("/name"),
            email: oView.getModel().getProperty("/email"),
            message: oView.getModel().getProperty("/message"),
          };

          jQuery.sap.require("jquery.sap.storage");
          var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
          var aMessages = oStorage.get("Messages") || [];
          aMessages.push(oFormData);
          oStorage.put("Messages", aMessages);

          MessageToast.show(
            "The input is validated. Your form has been submitted."
          );
        } else {
          MessageBox.alert(
            "A validation error has occurred. Complete your input first."
          );
        }
      },

      customEMailType: SimpleType.extend("email", {
        formatValue: function (oValue) {
          return oValue;
        },

        parseValue: function (oValue) {
          return oValue;
        },

        validateValue: function (oValue) {
          var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
          if (!oValue.match(rexMail)) {
            throw new ValidateException(
              "'" + oValue + "' is not a valid e-mail address"
            );
          }
        },
      }),
    });
  }
);
