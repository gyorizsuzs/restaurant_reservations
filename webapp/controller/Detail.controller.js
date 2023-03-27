sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/library",
    "sap/ui/core/Fragment",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/json/JSONModel",
    "sap/ui/unified/library",
    "sap/m/library",
    "sap/m/MessageToast",
  ],
  function (
    Controller,
    History,
    coreLibrary,
    Fragment,
    DateFormat,
    JSONModel,
    unifiedLibrary,
    mobileLibrary,
    MessageToast
  ) {
    "use strict";

    var CalendarDayType = unifiedLibrary.CalendarDayType;
    var ValueState = coreLibrary.ValueState;
    var StickyMode = mobileLibrary.PlanningCalendarStickyMode;

    return Controller.extend("sap.ui.demo.walkthrough.controller.Detail", {
      onInit: function () {
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("detail")
          .attachPatternMatched(this._onObjectMatched, this);

        var oModel = new JSONModel();
        oModel.setData({
          startDate: new Date("2023", "3", "1"),
          appointments: [
            {
              title: "",
              type: CalendarDayType.Type03,
              startDate: new Date("2023", "3", "1", "12", "0"),
              endDate: new Date("2023", "3", "1", "14", "0"),
            },
            {
              title: "",
              type: CalendarDayType.Type03,
              startDate: new Date("2023", "3", "1", "14", "0"),
              endDate: new Date("2023", "3", "1", "16", "0"),
            },
            {
              title: "",
              type: CalendarDayType.Type03,
              startDate: new Date("2023", "3", "1", "13", "0"),
              endDate: new Date("2023", "3", "1", "15", "0"),
            },
            {
              title: "",
              type: CalendarDayType.Type03,
              startDate: new Date("2023", "3", "1", "15", "0"),
              endDate: new Date("2023", "3", "1", "17", "0"),
            },
          ],
          supportedAppointmentItems: [
            {
              text: "Booking",
              type: CalendarDayType.Type01,
            },
          ],
        });

        this.getView().setModel(oModel);

        oModel = new JSONModel();
        oModel.setData({ allDay: false });
        this.getView().setModel(oModel, "allDay");

        oModel = new JSONModel();
        oModel.setData({
          stickyMode: StickyMode.None,
          enableAppointmentsDragAndDrop: true,
          enableAppointmentsResize: true,
          enableAppointmentsCreate: true,
        });
        this.getView().setModel(oModel, "settings");
      },

      _typeFormatter: function (sType) {
        var sTypeText = "",
          aTypes = this.getView()
            .getModel()
            .getData().supportedAppointmentItems;

        for (var i = 0; i < aTypes.length; i++) {
          if (aTypes[i].type === sType) {
            sTypeText = aTypes[i].text;
          }
        }

        if (sTypeText !== "") {
          return sTypeText;
        } else {
          return sType;
        }
      },

      handleAppointmentDrop: function (oEvent) {
        var oAppointment = oEvent.getParameter("appointment"),
          oStartDate = oEvent.getParameter("startDate"),
          oEndDate = oEvent.getParameter("endDate"),
          bCopy = oEvent.getParameter("copy"),
          sAppointmentTitle = oAppointment.getTitle(),
          oModel = this.getView().getModel(),
          oNewAppointment;

        if (bCopy) {
          oNewAppointment = {
            title: sAppointmentTitle,
            icon: oAppointment.getIcon(),
            text: oAppointment.getText(),
            type: oAppointment.getType(),
            startDate: oStartDate,
            endDate: oEndDate,
          };
          oModel.getData().appointments.push(oNewAppointment);
          oModel.updateBindings();
        } else {
          oAppointment.setStartDate(oStartDate);
          oAppointment.setEndDate(oEndDate);
        }

        MessageToast.show(
          "Appointment with title \n'" +
            sAppointmentTitle +
            "'\n has been " +
            (bCopy ? "create" : "moved")
        );
      },

      handleAppointmentCreateDnD: function (oEvent) {
        var oStartDate = oEvent.getParameter("startDate"),
          oEndDate = oEvent.getParameter("endDate"),
          sAppointmentTitle = "New Appointment",
          oModel = this.getView().getModel(),
          oNewAppointment = {
            title: sAppointmentTitle,
            startDate: oStartDate,
            endDate: oEndDate,
          };

        oModel.getData().appointments.push(oNewAppointment);
        oModel.updateBindings();

        MessageToast.show(
          "Appointment with title \n'" +
            sAppointmentTitle +
            "'\n has been created"
        );
      },

      handleViewChange: function () {
        MessageToast.show("'viewChange' event fired.");
      },

      handleAppointmentSelect: function (oEvent) {
        var oAppointment = oEvent.getParameter("appointment"),
          oStartDate,
          oEndDate,
          oTrimmedStartDate,
          oTrimmedEndDate,
          bAllDate,
          oModel,
          oView = this.getView();

        if (oAppointment === undefined) {
          return;
        }

        oStartDate = oAppointment.getStartDate();
        oEndDate = oAppointment.getEndDate();
        oTrimmedStartDate = new Date(oStartDate);
        oTrimmedEndDate = new Date(oEndDate);
        bAllDate = false;
        oModel = this.getView().getModel("allDay");

        if (!oAppointment.getSelected() && this._pDetailsPopover) {
          this._pDetailsPopover.then(function (oResponsivePopover) {
            oResponsivePopover.close();
          });
          return;
        }

        this._setHoursToZero(oTrimmedStartDate);
        this._setHoursToZero(oTrimmedEndDate);

        if (
          oStartDate.getTime() === oTrimmedStartDate.getTime() &&
          oEndDate.getTime() === oTrimmedEndDate.getTime()
        ) {
          bAllDate = true;
        }

        oModel.getData().allDay = bAllDate;
        oModel.updateBindings();

        if (!this._pDetailsPopover) {
          this._pDetailsPopover = Fragment.load({
            id: oView.getId(),
            name: "sap.ui.demo.walkthrough.view..Details",
            controller: this,
          }).then(function (oResponsivePopover) {
            oView.addDependent(oResponsivePopover);
            return oResponsivePopover;
          });
        }
        this._pDetailsPopover.then(function (oResponsivePopover) {
          oResponsivePopover.setBindingContext(
            oAppointment.getBindingContext()
          );
          oResponsivePopover.openBy(oAppointment);
        });
      },

      handleMoreLinkPress: function (oEvent) {
        var oDate = oEvent.getParameter("date"),
          oSinglePlanningCalendar = this.getView().byId("SPC1");

        oSinglePlanningCalendar.setSelectedView(
          oSinglePlanningCalendar.getViews()[2]
        ); // DayView

        this.getView().getModel().setData({ startDate: oDate }, true);
      },

      handleEditButton: function () {
        var oDetailsPopover = this.byId("detailsPopover");
        oDetailsPopover.close();
        this.sPath = oDetailsPopover.getBindingContext().getPath();
        this._arrangeDialogFragment("Edit appointment");
      },

      handlePopoverDeleteButton: function () {
        var oModel = this.getView().getModel(),
          oAppointments = oModel.getData().appointments,
          oDetailsPopover = this.byId("detailsPopover"),
          oAppointment = oDetailsPopover._getBindingContext().getObject();

        oDetailsPopover.close();

        oAppointments.splice(oAppointments.indexOf(oAppointment), 1);
        oModel.updateBindings();
      },

      _arrangeDialogFragment: function (sTitle) {
        var oView = this.getView();

        if (!this._pNewAppointmentDialog) {
          this._pNewAppointmentDialog = Fragment.load({
            id: oView.getId(),
            name: "sap.ui.demo.walkthrough.view.Modify",
            controller: this,
          }).then(function (oNewAppointmentDialog) {
            oView.addDependent(oNewAppointmentDialog);
            return oNewAppointmentDialog;
          });
        }

        this._pNewAppointmentDialog.then(
          function (oNewAppointmentDialog) {
            this._arrangeDialog(sTitle, oNewAppointmentDialog);
          }.bind(this)
        );
      },

      _arrangeDialog: function (sTitle, oNewAppointmentDialog) {
        this._setValuesToDialogContent(oNewAppointmentDialog);
        oNewAppointmentDialog.setTitle(sTitle);
        oNewAppointmentDialog.open();
      },

      _setValuesToDialogContent: function (oNewAppointmentDialog) {
        var oAllDayAppointment = this.byId("allDay"),
          sStartDatePickerID = oAllDayAppointment.getSelected()
            ? "DPStartDate"
            : "DTPStartDate",
          sEndDatePickerID = oAllDayAppointment.getSelected()
            ? "DPEndDate"
            : "DTPEndDate",
          oTitleControl = this.byId("appTitle"),
          oTextControl = this.byId("moreInfo"),
          oTypeControl = this.byId("appType"),
          oStartDateControl = this.byId(sStartDatePickerID),
          oEndDateControl = this.byId(sEndDatePickerID),
          oEmptyError = { errorState: false, errorMessage: "" },
          oContext,
          oContextObject,
          oSPCStartDate,
          sTitle,
          sText,
          oStartDate,
          oEndDate,
          sType;

        if (this.sPath) {
          oContext = this.byId("detailsPopover").getBindingContext();
          oContextObject = oContext.getObject();
          sTitle = oContextObject.title;
          sText = oContextObject.text;
          oStartDate = oContextObject.startDate;
          oEndDate = oContextObject.endDate;
          sType = oContextObject.type;
        } else {
          sTitle = "";
          sText = "";
          if (this._oChosenDayData) {
            oStartDate = this._oChosenDayData.start;
            oEndDate = this._oChosenDayData.end;

            delete this._oChosenDayData;
          } else {
            oSPCStartDate = this.getView().byId("SPC1").getStartDate();
            oStartDate = new Date(oSPCStartDate);
            oStartDate.setHours(this._getDefaultAppointmentStartHour());
            oEndDate = new Date(oSPCStartDate);
            oEndDate.setHours(this._getDefaultAppointmentEndHour());
          }
          oAllDayAppointment.setSelected(false);
          sType = "Type01";
        }

        oTitleControl.setValue(sTitle);
        oTextControl.setValue(sText);
        oStartDateControl.setDateValue(oStartDate);
        oEndDateControl.setDateValue(oEndDate);
        oTypeControl.setSelectedKey(sType);
        this._setDateValueState(oStartDateControl, oEmptyError);
        this._setDateValueState(oEndDateControl, oEmptyError);
        this.updateButtonEnabledState(
          oStartDateControl,
          oEndDateControl,
          oNewAppointmentDialog.getBeginButton()
        );
      },

      handleDialogOkButton: function () {
        var bAllDayAppointment = this.byId("allDay").getSelected(),
          sStartDate = bAllDayAppointment ? "DPStartDate" : "DTPStartDate",
          sEndDate = bAllDayAppointment ? "DPEndDate" : "DTPEndDate",
          sTitle = this.byId("appTitle").getValue(),
          sText = this.byId("moreInfo").getValue(),
          sType = this.byId("appType").getSelectedItem().getKey(),
          oStartDate = this.byId(sStartDate).getDateValue(),
          oEndDate = this.byId(sEndDate).getDateValue(),
          oModel = this.getView().getModel(),
          sAppointmentPath;

        if (
          this.byId(sStartDate).getValueState() !== ValueState.Error &&
          this.byId(sEndDate).getValueState() !== ValueState.Error
        ) {
          if (this.sPath) {
            sAppointmentPath = this.sPath;
            oModel.setProperty(sAppointmentPath + "/title", sTitle);
            oModel.setProperty(sAppointmentPath + "/text", sText);
            oModel.setProperty(sAppointmentPath + "/type", sType);
            oModel.setProperty(sAppointmentPath + "/startDate", oStartDate);
            oModel.setProperty(sAppointmentPath + "/endDate", oEndDate);
          } else {
            oModel.getData().appointments.push({
              title: sTitle,
              text: sText,
              type: sType,
              startDate: oStartDate,
              endDate: oEndDate,
            });
          }

          oModel.updateBindings();

          this.byId("modifyDialog").close();
        }
      },

      formatDate: function (oDate) {
        if (oDate) {
          var iHours = oDate.getHours(),
            iMinutes = oDate.getMinutes(),
            iSeconds = oDate.getSeconds();

          if (iHours !== 0 || iMinutes !== 0 || iSeconds !== 0) {
            return DateFormat.getDateTimeInstance({ style: "medium" }).format(
              oDate
            );
          } else {
            return DateFormat.getDateInstance({ style: "medium" }).format(
              oDate
            );
          }
        }
      },

      handleDialogCancelButton: function () {
        this.sPath = null;
        this.byId("modifyDialog").close();
      },

      handleCheckBoxSelect: function (oEvent) {
        var bSelected = oEvent.getSource().getSelected(),
          sStartDatePickerID = bSelected ? "DTPStartDate" : "DPStartDate",
          sEndDatePickerID = bSelected ? "DTPEndDate" : "DPEndDate",
          oOldStartDate = this.byId(sStartDatePickerID).getDateValue(),
          oNewStartDate = new Date(oOldStartDate),
          oOldEndDate = this.byId(sEndDatePickerID).getDateValue(),
          oNewEndDate = new Date(oOldEndDate);

        if (!bSelected) {
          oNewStartDate.setHours(this._getDefaultAppointmentStartHour());
          oNewEndDate.setHours(this._getDefaultAppointmentEndHour());
        } else {
          this._setHoursToZero(oNewStartDate);
          this._setHoursToZero(oNewEndDate);
        }

        sStartDatePickerID = !bSelected ? "DTPStartDate" : "DPStartDate";
        sEndDatePickerID = !bSelected ? "DTPEndDate" : "DPEndDate";
        this.byId(sStartDatePickerID).setDateValue(oNewStartDate);
        this.byId(sEndDatePickerID).setDateValue(oNewEndDate);
      },

      _getDefaultAppointmentStartHour: function () {
        return 9;
      },

      _getDefaultAppointmentEndHour: function () {
        return 10;
      },

      _setHoursToZero: function (oDate) {
        oDate.setHours(0, 0, 0, 0);
      },

      handleAppointmentCreate: function () {
        this._createInitialDialogValues(
          this.getView().byId("SPC1").getStartDate()
        );
      },

      handleHeaderDateSelect: function (oEvent) {
        this._createInitialDialogValues(oEvent.getParameter("date"));
      },

      _createInitialDialogValues: function (oDate) {
        var oStartDate = new Date(oDate),
          oEndDate = new Date(oStartDate);

        oStartDate.setHours(this._getDefaultAppointmentStartHour());
        oEndDate.setHours(this._getDefaultAppointmentEndHour());
        this._oChosenDayData = { start: oStartDate, end: oEndDate };
        this.sPath = null;

        this._arrangeDialogFragment("Create appointment");
      },

      handleStartDateChange: function (oEvent) {
        var oStartDate = oEvent.getParameter("date");
        MessageToast.show(
          "'startDateChange' event fired.\n\nNew start date is " +
            oStartDate.toString()
        );
      },

      updateButtonEnabledState: function (
        oDateTimePickerStart,
        oDateTimePickerEnd,
        oButton
      ) {
        var bEnabled =
          oDateTimePickerStart.getValueState() !== ValueState.Error &&
          oDateTimePickerStart.getValue() !== "" &&
          oDateTimePickerEnd.getValue() !== "" &&
          oDateTimePickerEnd.getValueState() !== ValueState.Error;

        oButton.setEnabled(bEnabled);
      },

      handleDateTimePickerChange: function (oEvent) {
        var oDateTimePickerStart = this.byId("DTPStartDate"),
          oDateTimePickerEnd = this.byId("DTPEndDate"),
          oStartDate = oDateTimePickerStart.getDateValue(),
          oEndDate = oDateTimePickerEnd.getDateValue(),
          oErrorState = { errorState: false, errorMessage: "" };

        if (!oStartDate) {
          oErrorState.errorState = true;
          oErrorState.errorMessage = "Please pick a date";
          this._setDateValueState(oDateTimePickerStart, oErrorState);
        } else if (!oEndDate) {
          oErrorState.errorState = true;
          oErrorState.errorMessage = "Please pick a date";
          this._setDateValueState(oDateTimePickerEnd, oErrorState);
        } else if (!oEvent.getParameter("valid")) {
          oErrorState.errorState = true;
          oErrorState.errorMessage = "Invalid date";
          if (oEvent.getSource() === oDateTimePickerStart) {
            this._setDateValueState(oDateTimePickerStart, oErrorState);
          } else {
            this._setDateValueState(oDateTimePickerEnd, oErrorState);
          }
        } else if (
          oStartDate &&
          oEndDate &&
          oEndDate.getTime() <= oStartDate.getTime()
        ) {
          oErrorState.errorState = true;
          oErrorState.errorMessage = "Start date should be before End date";
          this._setDateValueState(oDateTimePickerStart, oErrorState);
          this._setDateValueState(oDateTimePickerEnd, oErrorState);
        } else {
          this._setDateValueState(oDateTimePickerStart, oErrorState);
          this._setDateValueState(oDateTimePickerEnd, oErrorState);
        }

        this.updateButtonEnabledState(
          oDateTimePickerStart,
          oDateTimePickerEnd,
          this.byId("modifyDialog").getBeginButton()
        );
      },

      handleDatePickerChange: function () {
        var oDatePickerStart = this.byId("DPStartDate"),
          oDatePickerEnd = this.byId("DPEndDate"),
          oStartDate = oDatePickerStart.getDateValue(),
          oEndDate = oDatePickerEnd.getDateValue(),
          bEndDateBiggerThanStartDate =
            oEndDate.getTime() < oStartDate.getTime(),
          oErrorState = { errorState: false, errorMessage: "" };

        if (oStartDate && oEndDate && bEndDateBiggerThanStartDate) {
          oErrorState.errorState = true;
          oErrorState.errorMessage = "Start date should be before End date";
        }
        this._setDateValueState(oDatePickerStart, oErrorState);
        this._setDateValueState(oDatePickerEnd, oErrorState);
        this.updateButtonEnabledState(
          oDatePickerStart,
          oDatePickerEnd,
          this.byId("modifyDialog").getBeginButton()
        );
      },

      _setDateValueState: function (oPicker, oErrorState) {
        if (oErrorState.errorState) {
          oPicker.setValueState(ValueState.Error);
          oPicker.setValueStateText(oErrorState.errorMessage);
        } else {
          oPicker.setValueState(ValueState.None);
        }
      },
      _onObjectMatched: function (oEvent) {
        this.getView().bindElement({
          path:
            "/" +
            window.decodeURIComponent(
              oEvent.getParameter("arguments").restaurantPath
            ),
          model: "restaurant",
        });
      },

      onNavBack: function () {
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          var oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("overview", {}, true);
        }
      },
    });
  }
);
