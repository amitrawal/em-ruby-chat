require 'rubygems'
require 'bundler'
Bundler.setup

require 'eventmachine'
require 'em-websocket'
require 'json'

module Chat
  class ClientConnection
    attr_accessor :web_socket, :user_id, :screen_name
    def initialize(ws, user_id, screen_name)
      self.web_socket = ws
      self.user_id = user_id
      self.screen_name = screen_name
    end

    def send_message(message)
      self.web_socket.send message
    end

    def to_hash
      {:id => self.user_id, :screen_name => self.screen_name}
    end

    def to_json
      to_hash.to_json
    end
  end

  class UserOfflineError < StandardError
  end

  class Server
    MESSAGE_TYPES = {
        :user_connected => 'user_connected',
        :user_joined => 'user_joined',
        :user_left => 'user_left',
        :chat => 'chat',
        :user_list => 'user_list',
        :user_typing => 'user_typing'
    }

    def initialize
      @connections = {}
    end

    def on_open(ws, parameters)
      #ws.send({
      #  :message_type => MESSAGE_TYPES[:user_connected], :data => {:id => parameters['id'], :screen_name => parameters['screen_name']}
      #}.to_json)
    end

    def on_close(ws)
      conn = self.remove_connection ws

      self.broadcast(
          {:message_type => MESSAGE_TYPES[:user_left], :data => conn.to_hash}.to_json
      )
    end

    def on_message(ws, msg)
      message = JSON.parse(msg)
      handleMessages(ws, msg)
    end

    def add_connection(ws, user_info = {})
      @connections[user_info['id']] = ClientConnection.new(ws, user_info['id'], user_info['screen_name'])
    end

    def remove_connection(ws)
      key, value = @connections.detect do |key, con|
        con.web_socket == ws
      end
      @connections.delete key
    end

    def send_message_to(id, message)
      raise UserOfflineError, "User-#{id} is not connected" unless @connections.has_key?(id)

      @connections[id].send_message message
    end

    def broadcast(message, except = [])
      connections = @connections.reject {|id, con| except.include? id }
      connections.each do |id, con|
        con.send_message message
      end
    end

    private

    def handleMessages(ws, msg)
      p 'Message Received...'
      p msg
      message = JSON.parse(msg)

      case message['message_type']
        when MESSAGE_TYPES[:user_connected]
          handle_user_connected(ws, message['data'])
        when MESSAGE_TYPES[:chat]
          handle_chat_message(message['data'])
        when MESSAGE_TYPES[:user_typing]
          handle_user_typing(message['data'])
      end
    end

    # data = {'id' => 1234, 'screen_name' => 'amit'}
    def handle_user_connected(ws, data)
      online_connections = @connections.collect do |key, conn|
        conn.to_hash
      end

      conn = self.add_connection(ws, data)

      # Broadcast all the clients that a new user joined
      self.broadcast(
          {:message_type => MESSAGE_TYPES[:user_joined], :data => conn.to_hash}.to_json,
          [conn.user_id]
      )

      # send the online user list to the newly joined user
      user_list = {:message_type => MESSAGE_TYPES[:user_list], :data => online_connections}.to_json
      self.send_message_to(conn.user_id, user_list)
    end

    def handle_chat_message(data)
      to = data['to']

      begin
        self.send_message_to to['id'], {:message_type => MESSAGE_TYPES[:chat], :data => {:message => data['message'], :from => data['from']}}.to_json
      rescue UserOfflineError
        # send the message back to the sender saying that the user is offline
        self.send_message_to data['from']['id'], {:message_type => 'chat', :data => {:message => 'I am  offline', :from => to}}.to_json
      end
    end

    def handle_user_typing(data)
      to = data['to']
      from = data['from']
      self.send_message_to to['id'], {:message_type => 'user_typing', :data => {:to => to, :from => from}}.to_json
    end

  end
end


EM.run do
  server = Chat::Server.new

  EM::WebSocket.start(:host => "0.0.0.0", :port => 8100) do |ws|
    ws.onopen do |handshake|
      server.on_open(ws, handshake.query)
    end

    ws.onclose do |handshake|

      server.on_close ws
      puts "Connection closed"
    end

    ws.onmessage do |msg|
      server.on_message(ws, msg)
    end
  end
end
