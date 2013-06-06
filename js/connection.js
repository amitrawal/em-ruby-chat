var ChatClient = function (endpoint) {
    this.endpoint = endpoint;
    this.connection = null;
};

ChatClient.prototype.connect = function() {
    console.log('ChatClient#connect');
    if (typeof WebSocket === 'undefined') {
        alert("Your browser does not support websockets.");
    }
    this.connection = new WebSocket(this.endpoint);
};

ChatClient.prototype.sendMessage = function(message) {
    console.log('ChatClient#sendMessage');
    this.connection.send(message);
};