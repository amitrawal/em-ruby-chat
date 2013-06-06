// Main class which manages all the chat interaction.
var ChatManager = function(u, options) {
    var defaults = {
        endpoint: 'ws://0.0.0.0:8100',
        userListElId: 'membersList'
    };
    var settings = $.extend({}, defaults, options);
    var user = u,
        endpoint = defaults.endpoint,
        client = new ChatClient(endpoint),
        self = this,
        chatBoxManager = new ChatboxManager(),
        userListManager = new UserListManager([], settings.userListElId);


    var handleEvents = function() {
        var connection = client.connection;
        connection.onmessage = function (evt) {
            console.log('ChatManager#handleEvents');
            var data = evt.data;
            handleMessage(data);
        };

        connection.onclose = function() {
            console.log('onclose');
        };

        connection.onopen = function() {
            console.log('onopen');
            var message = {message_type: 'user_connected', data: {id: user.id, screen_name: user.screen_name}};
            client.sendMessage(JSON.stringify(message));
        };
    },
    handleMessage = function(data) {
        var message = JSON.parse(data),
            message_type = message.message_type,
            message_data = message.data;
        console.log('handleMessage');
        console.log(message);

        switch(message_type) {
        // a normal chat message
        case 'chat':
            var chatBoxId = message_data['from'].id + '-box',
                chatBox = chatBoxManager.addBox(chatBoxId, 
                    user,
                    message_data['from'].screen_name, 
                    message_data['from'], 
                    sendChatMessage, 
                    onMessageTyping);

            chatBox.chatbox('addMessage', message_data['from'].screen_name, message_data['message']);
            break;
        // Received online user list
        case 'user_list':
            console.log('User List received...');
            userListManager.reset(message_data);
            break;
        // New user came online
        case 'user_joined':
            console.log('a user joined. Updating user list...');
            userListManager.add(message_data);
            break;
        // A user went offline
        case 'user_left':
            console.log('a user Left. Updating user list...');
            userListManager.remove(message_data);
            break;
        // A user is typing a message
        case 'user_typing':
            var to = message_data['to'],
                from = message_data['from'],
                chatBoxId = message_data['from'].id + '-box',
                chatBox = $('#' + chatBoxId);
                
            chatBox.chatbox('chatInfo', 'Typing...');
            break;
        }
    },
    startChat = function(withUser) {
        var chatBoxId = withUser.id + '-box';
        console.log('ChatManager#startChat');
        chatBoxManager.addBox(chatBoxId, user, withUser.screen_name, withUser, sendChatMessage, onMessageTyping);
    },
    sendChatMessage = function(msg, to) {
        var message = {message_type: 'chat', 'data': {'message': msg, 'from': user, 'to': to}};
        client.sendMessage(JSON.stringify(message));
    },
    attachEvents = function() {
        $(document).on('startChat', function(e, user) {
           startChat(user);
        })
    },
    onMessageTyping = function(to) {
        var message = {message_type: 'user_typing', 'data': {'to': to, 'from': user}};
        client.sendMessage(JSON.stringify(message));
    };

    client.connect();
    handleEvents();
    attachEvents();

    return {
        startChat: startChat
    };
};