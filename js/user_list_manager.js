// @list    - Is the list of users.
// @el      - Is the dom element where the user names should be listed.
var UserListManager = function(list, el) {
    this.userList = list;
    this.el = $('#' + el);
    var self = this;

    // Listen to a custom event, which gets raised when the user list is changed.
    this.el.on('userListChanged', function(e) {
        var $this = $(this);
        $this.html('');
        $(self.userList).each(function(idx, user) {
            var a = $('<a>', {id: 'chatWith' + user.id, href:'#' + user.screen_name});
            a.data('userInfo', user);
            a.html(user.screen_name);
            $this.append(a);
        });
    });

    this.el.on('click', 'a', function(e) {
        e.preventDefault();
        var $this = $(this),
            user = $this.data('userInfo');

        $.event.trigger('startChat', user);
    });
};

UserListManager.prototype.reset = function(list) {
    this.userList = list;
    this.el.trigger('userListChanged');
};

UserListManager.prototype.add = function(user) {
    if(this.userList.indexOf(user) == -1) {
        this.userList.push(user);
        this.el.trigger('userListChanged');
    }
};

UserListManager.prototype.remove = function(user) {
    var idx = this.userList.indexOf(user);
    this.userList.splice(idx, 1);
    this.el.trigger('userListChanged');
};