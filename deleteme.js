'use strict';
var _this = this;

function dispContactPopup(value, contactType) {

  var modalInstance = $modal.open({
    windowClass: 'contact-modal',
    templateUrl: 'modules/dashboard/templates/addContact.html',
    controller: function($scope, $modalInstance) {
      $scope.contact = _this.contact;
      _this.contact.setName(value);
      _this.contact.type = contactType;
      if (contactType === contactType.recipient) {
        _this.contactList = _this.recipients;
        $scope.checkboxModel = {
          isRecipient: true,
          isSender: false
        };
      } else if (contactType === contactType.sender) {
        _this.contactList = _this.recipients;
        $scope.checkboxModel = {
          isRecipient: false,
          isSender: true
        };
      }

    }
  });
}
