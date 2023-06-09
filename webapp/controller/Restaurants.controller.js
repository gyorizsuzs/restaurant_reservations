sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("sap.ui.demo.walkthrough.controller.Restaurants", {
    onPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.navTo("detail", {
        restaurantPath: window.encodeURIComponent(
          oItem.getBindingContext("restaurant").getPath().substr(1)
        ),
      });
    },
  });
});
