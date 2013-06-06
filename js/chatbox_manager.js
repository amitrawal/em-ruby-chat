var ChatboxManager = function(options) {
  var visibleBoxes = new Array(),
    gap = 25, width = 240,
    hiddenBoxs = new Array();

  // Adds a chat box to the dom. If the chat box with given ID already exists then shows it
  // else creates one.
  var addBox = function(id, from, title, to, onMessageSent, onMessageTyping) {
    console.log('ChatboxManager#addBox');
    var idx1 = visibleBoxes.indexOf(id),
      idx2 = hiddenBoxs.indexOf(id);

    if(idx1 > -1) {
      // Already visible Do nothing
    } else if(idx2 > -1) {
      // Box present but not visible.
      hiddenBoxs.splice(idx2, 1);
      visibleBoxes.push(id);
      recalculateOffsets();
    } else {
      console.log('creating a box');
      var el = $("<div></div>", {id: id});
      el.appendTo('body');
      el.chatbox({
        id: id,
        title: title,
        offset: visibleBoxes.length * (width + gap),
        from: from,
        to: to,
        messageSent: onMessageSent,
        boxClosed: closeBoxCallback
      });

      el.on('messageTyped', function(e, sendingToUser) {
                
        onMessageTyping(sendingToUser['to']);
      });
      visibleBoxes.push(id);
    }
    return $('#' + id);
  },
  closeBoxCallback = function(boxId) {
    var idx = visibleBoxes.indexOf(boxId);
    hiddenBoxs.push(boxId);
    visibleBoxes.splice(idx, 1);
    recalculateOffsets();    
  },
  // calculates the position where the box should be placed on the screen.
  recalculateOffsets = function() {
    var initialOffset = 0;
    for(var i = 0; i < visibleBoxes.length; i++) {
      $('#' + visibleBoxes[i]).chatbox('showBox');
      $('#' + visibleBoxes[i]).chatbox('offset', initialOffset);
      console.log(initialOffset);
      initialOffset += (width + gap);      
    }
  };

  return {
    addBox: addBox
  };
};