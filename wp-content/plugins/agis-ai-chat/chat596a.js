console.log('AGIS AI - RM 3-31-26 - Chat Loaded');

let chatRendered = false;
let chatDomain = '';
let isRestoringHistory = false;
let historyRestored = false;
let lastShownDomain = '';
let isEnlarged = false;
let userMsgBgColor = '';
let aiMsgBgColor = '';
let userMsgFontColor = '';
let aiMsgFontColor = '';
let chatMsgFontSize = null;
let userMessagePadding = null;
let userMessageBorderRadius = null;
let userMessageBubbleTail = false;
let aiMessagePadding = null;
let aiMessageBorderRadius = null;
let aiMessageBubbleTail = false;
let chatInputFontColor = null;
let sendBtnBgColor = null;
let sendButtonFontColor = null;
let sendButtonBorderRadius = null;
let sendButtonPadding = 12;
let chatBoxLookAndFeel = undefined;
let userTesting = false;
let mediaRecorder;
let audioChunks = [];
let audioBlob;
let voiceID = undefined;

const destroyChatUi = () => {
  jQuery('#agis-chat-root').remove();
  chatRendered = false;
  historyRestored = false;
};

const closeChat = () => {
  jQuery('#chatContainer').fadeOut(() => {
    showChatMinimized(chatDomain);
  });
};

const getStartConversationText = () => {
  let startConversationText = 'Start the conversation...';
  if (chatBoxLookAndFeel?.behavior?.startConversationText !== undefined) {
    const candidate = String(chatBoxLookAndFeel.behavior.startConversationText || '').trim();
    if (candidate) {
      startConversationText = candidate;
    }
  }
  return startConversationText;
};

const showChatContainerWithFade = () => {
  jQuery('#chatContainer')
    .stop(true, true)
    .css({
      display: 'flex',
      opacity: 0
    })
    .animate({ opacity: 1 }, 200);
};

const initializeMinimizedChatState = async () => {
  if (!chatBoxLookAndFeel) {
    chatBoxLookAndFeel = await getLookAndFeelData(chatDomain);
  }

  let icon = chatBoxLookAndFeel?.chatIcon || '/admin/chatIconDefault.png';
  let fullIconUrl = iconUrl + icon;

  jQuery('#chatIcon').attr('src', fullIconUrl);
  setMinimizedChatLookAndFeel((chatBoxLookAndFeel && chatBoxLookAndFeel.behavior) || {});
  jQuery('#chatContainer').hide();
  jQuery('#minimizedChatContainer')
    .stop(true, true)
    .css('display', 'block')
    .hide()
    .fadeIn(150);
};

const restoreHistory = async (domain) => {
  if (!window.ChatStorage) return;

  // Guard: only restore once per chat session. Reset when #chatMessages is wiped.
  if (historyRestored) return;
  historyRestored = true;

  try {
    jQuery('#chatInput').prop('disabled', true);
    jQuery('#sendMessageBtn').prop('disabled', true);

    await ChatStorage.init();
    const messages = await ChatStorage.loadMessages(domain);

    if (messages.length > 0) {
      jQuery('#chatStartMessage').remove();
      isRestoringHistory = true;
      messages.forEach((msg) => {
        appendMessage(msg.timestamp, msg.sender, msg.text);
      });
      isRestoringHistory = false;
      jQuery('#chatMessages').scrollTop(jQuery('#chatMessages')[0].scrollHeight);
    }
  } catch (err) {
    console.error('ChatStorage: restoreHistory failed', err);
    isRestoringHistory = false;
    historyRestored = false;
  } finally {
    jQuery('#chatInput').prop('disabled', false);
    jQuery('#sendMessageBtn').prop('disabled', false);
  }
};

const renderChatHtml = async (overrideDomain = undefined, options = {}) => {
  if (chatRendered) {
    return;
  }

  const { autoShowMinimized = true } = options;

  if (overrideDomain) {
    chatDomain = overrideDomain;
  }

  if (!chatDomain || chatDomain === '') {
    const url = window.location.hostname;
    chatDomain = url.replace(/^www\./, '');
  }

  console.log('Rendering chat html for domain: ' + chatDomain);

  if (!chatBoxLookAndFeel) {
    chatBoxLookAndFeel = await getLookAndFeelData(chatDomain);
  }

  const startConversationText = getStartConversationText();

  console.log('Inserting chat code for ' + chatDomain);

  jQuery('body').append(`
    <div id="agis-chat-root">
      <div id="minimizedChatContainer" style="position: fixed; cursor: pointer; display: none; z-index: 99999;">
        <img id="chatIcon" style="width: 100%; height: 100%;" src="">
      </div>

      <div id="chatContainer" class="agis-card" style="width: 350px; height: 400px; max-width: 95%; padding: 0; position: fixed; bottom: 20px; right: 20px; display: none; z-index: 99999; flex-direction: column; overflow: hidden;">
        <div class="agis-card-header agis-d-flex agis-justify-content-between agis-align-items-center">
          <span>Chat with AI</span>
          <div class="agis-btn-group">
            <button class="agis-btn agis-btn-sm agis-btn-secondary" id="smallModeBtn" title="Small Mode" style="display: none;">🗕</button>
            <button class="agis-btn agis-btn-sm agis-btn-secondary" id="enlargeModeBtn" title="Enlarge Mode" style="margin: 0 2px; background-color: #3673f9;">🗖</button>
            <button class="agis-btn agis-btn-sm agis-btn-danger" id="closeChatBtn" title="Close" style="margin: 0 5px; background-color: red;">×</button>
          </div>
        </div>

        <div class="agis-card-body" style="flex: 1 1 auto; min-height: 0; overflow-y: auto;" id="chatMessages">
          <div class="agis-text-muted agis-text-center" id="chatStartMessage">${startConversationText}</div>
        </div>

        <div class="agis-card-footer" style="flex: 0 0 auto; margin-top: auto;">
          <div class="agis-input-group">
            <input type="text" id="chatInput" class="agis-form-control" placeholder="Type your message..." />
            <img src="${iconUrl}/admin/recordingIdle.png" id="recordButton">
            <button class="agis-btn agis-btn-primary" id="sendMessageBtn">Send</button>
          </div>
        </div>
      </div>
    </div>
  `);

  chatRendered = true;

  jQuery('#minimizedChatContainer').on('click', function () {
    openChatFromMinimized();
  });

  jQuery('#sendMessageBtn').on('click', function () {
    console.log('Sending message {2} - sendMessageBtn click');
    sendMessage();
  });

  jQuery('#chatInput').on('keypress', function (e) {
    if (e.which === 13) {
      console.log('Sending message {3} - chatInput enter');
      sendMessage();
    }
  });

  jQuery('#closeChatBtn').on('click', function () {
    closeChat();
  });

  jQuery('#enlargeModeBtn').on('click', enlargeChat);
  jQuery('#smallModeBtn').on('click', smallChat);

  jQuery('#recordButton').on('mousedown', async function () {
    if (!mediaRecorder) {
      await setupRecorder(chatDomain);
    }
    jQuery('#recordButton').attr('src', `${iconUrl}/admin/recordingActive.png`);
    audioChunks = [];
    mediaRecorder.start();
    console.log('Recording started');
  });

  jQuery('#recordButton').on('mouseup mouseleave', function () {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      jQuery('#recordButton').attr('src', `${iconUrl}/admin/recordingIdle.png`);
      console.log('Recording stopped');
    }
  });

  jQuery('#chatContainer').hide();
  jQuery('#minimizedChatContainer').hide();

  if (autoShowMinimized) {
    await initializeMinimizedChatState();
  }
};

const showChatMinimized = async (domain, siteIconUrl = undefined) => {
  console.log('Showing minimized chat with siteIconUrl: ' + siteIconUrl);

  if (domain) {
    chatDomain = domain;
  }

  if (!chatDomain) {
    chatDomain = window.location.hostname.replace(/^www\./, '');
  }

  if (!chatRendered) {
    await renderChatHtml(chatDomain, { autoShowMinimized: false });
  }

  chatBoxLookAndFeel = await getLookAndFeelData(chatDomain);

  let icon = siteIconUrl || chatBoxLookAndFeel?.chatIcon || '/admin/chatIconDefault.png';
  let fullIconUrl = iconUrl + icon;

  console.log('chatBoxLookAndFeel data:', chatBoxLookAndFeel);
  console.log('Full Icon Url:' + fullIconUrl);

  jQuery('#chatIcon').attr('src', fullIconUrl);
  setMinimizedChatLookAndFeel((chatBoxLookAndFeel && chatBoxLookAndFeel.behavior) || {});
  jQuery('#chatContainer').hide();
  jQuery('#minimizedChatContainer')
    .stop(true, true)
    .css('display', 'block')
    .hide()
    .fadeIn(150);
};

const openChatFromMinimized = async () => {
  console.log('Showing chat');
  jQuery('#minimizedChatContainer').hide();
  setChatLookAndFeel(chatBoxLookAndFeel?.appearance, chatBoxLookAndFeel?.voice);
  setChatClientLookAndFeel(chatBoxLookAndFeel?.behavior);
  await restoreHistory(chatDomain);
  showChatContainerWithFade();
  jQuery('#chatInput').focus();
};

const showChat = async (domain, testing = false) => {
  const requestedDomain = String(domain || '').trim();
  if (!requestedDomain) {
    console.warn('showChat called without a domain');
    return;
  }

  console.log('Showing chat for domain:', requestedDomain);
  userTesting = testing;

  // If already rendered for this domain, just re-show — no wipe, no re-restore.
  if (chatRendered && chatDomain === requestedDomain) {
    if (jQuery('#chatContainer').is(':visible')) {
      console.log('showChat: chat already open for', requestedDomain, '— skipping');
      return;
    }
    chatBoxLookAndFeel = await getLookAndFeelData(requestedDomain);
    const payload = chatBoxLookAndFeel || {};
    setChatLookAndFeel(payload.appearance, payload.voice);
    setChatClientLookAndFeel(payload.behavior || {});
    await restoreHistory(requestedDomain);
    jQuery('#minimizedChatContainer').hide();
    showChatContainerWithFade();
    jQuery('#chatInput').focus();
    return;
  }

  if (lastShownDomain && lastShownDomain !== requestedDomain && chatRendered) {
    destroyChatUi();
  }

  chatDomain = requestedDomain;
  lastShownDomain = requestedDomain;
  voiceID = undefined;
  chatBoxLookAndFeel = await getLookAndFeelData(requestedDomain);

  if (!chatRendered) {
    await renderChatHtml(requestedDomain, { autoShowMinimized: false });
  }

  const payload = chatBoxLookAndFeel || {};

  let icon = payload.chatIcon || '/admin/chatIconDefault.png';
  let fullIconUrl = iconUrl + icon;
  jQuery('#chatIcon').attr('src', fullIconUrl);

  setChatClientLookAndFeel(payload.behavior || {});
  setMinimizedChatLookAndFeel(payload.behavior || {});

  if (payload.voice) {
    console.log('Assigned voice ID');
    voiceID = payload.voice.labId;
  }

  historyRestored = false;
  jQuery('#chatMessages').html('<div class="agis-text-muted agis-text-center" id="chatStartMessage"></div>');
  jQuery('#chatStartMessage').text(getStartConversationText());
  jQuery('#chatInput').val('');

  setChatLookAndFeel(payload.appearance, payload.voice);

  await restoreHistory(chatDomain);

  jQuery('#minimizedChatContainer').hide();
  showChatContainerWithFade();
  jQuery('#chatInput').focus();
};

const appendMessage = (dt, sender, text) => {
  console.log('Appending message:' + text);

  if (sender === 'user') {
    jQuery('#chatStartMessage').remove();
  }

  const messageClass = sender === 'user' ? 'agis-user-message agis-text-right' : 'agis-ai-message agis-text-left';
  const senderLabel = sender === 'user' ? 'You' : 'Assistant';
  const userMessageId = `User_${dt}`;
  const agentMessageId = `Agent_${dt}`;
  const messageId = sender === 'user' ? userMessageId : agentMessageId;

  let messageHTML;
  if (!userTesting) {
    messageHTML = `
      <div class="agis-my-2 agis-d-flex ${sender === 'user' ? 'agis-justify-content-end' : 'agis-justify-content-start'}">
        <div class="${messageClass}" id="${messageId}">
          <strong>${senderLabel}:</strong> ${text}
        </div>
      </div>
    `;
  } else {
    messageHTML = `
      <div class="agis-my-2 agis-d-flex ${sender === 'user' ? 'agis-justify-content-end' : 'agis-justify-content-start'}">
        <div id="${messageId}" class="${messageClass}">
          <strong>${senderLabel}:</strong> ${text}
        </div>
      </div>
    `;
    if (sender !== 'user') {
      messageHTML += `<div class="agis-downvote" onClick="downVoteResponse('${dt}')"><img src="${iconUrl}/admin/thumbsdown.png" class="agis-thumbsdown"> Click Here To Add To Test </div>`;
    }
  }

  jQuery('#chatMessages').append(messageHTML);

  if (sender === 'user') {
    if (userMsgBgColor) jQuery('#' + messageId).css('background-color', userMsgBgColor);
    if (userMsgFontColor) jQuery('#' + messageId).css('color', userMsgFontColor);
  } else {
    if (aiMsgBgColor) jQuery('#' + messageId).css('background-color', aiMsgBgColor);
    if (aiMsgFontColor) jQuery('#' + messageId).css('color', aiMsgFontColor);
  }
  if (chatMsgFontSize) jQuery('#' + messageId).css('font-size', chatMsgFontSize + 'px');

  jQuery('#chatMessages').scrollTop(jQuery('#chatMessages')[0].scrollHeight);

  if (!isRestoringHistory && sender === 'user' && window.ChatStorage) {
    ChatStorage.saveMessage({
      id: `User_${dt}`,
      domain: chatDomain,
      sender: 'user',
      text: text,
      timestamp: dt
    }).catch((err) => console.error('ChatStorage: failed to save user message', err));
  }
};

const showThinkingIndicator = (dt) => {
  const agentMessageId = `Agent_${dt}`;
  const dot = (delay) =>
    `<span id="agis-dot-${dt}-${delay}" style="display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:currentColor;opacity:0;vertical-align:middle;"></span>`;

  const messageHTML = `
    <div class="agis-my-2 agis-d-flex agis-justify-content-start" id="thinking_wrap_${dt}">
      <div class="agis-ai-message agis-text-left" id="${agentMessageId}">
        <strong>Assistant:</strong>
        <span style="display:inline-flex;align-items:center;margin-left:6px;gap:2px;">
          ${dot(0)}${dot(1)}${dot(2)}
        </span>
      </div>
    </div>
  `;
  jQuery('#chatMessages').append(messageHTML);
  if (aiMsgBgColor) jQuery('#' + agentMessageId).css('background-color', aiMsgBgColor);
  if (aiMsgFontColor) jQuery('#' + agentMessageId).css('color', aiMsgFontColor);
  if (chatMsgFontSize) jQuery('#' + agentMessageId).css('font-size', chatMsgFontSize + 'px');

  // Drive opacity via JS — works regardless of site CSS/CSP.
  window._agisThinkingIntervals = window._agisThinkingIntervals || {};
  const dots = [
    document.getElementById(`agis-dot-${dt}-0`),
    document.getElementById(`agis-dot-${dt}-1`),
    document.getElementById(`agis-dot-${dt}-2`)
  ];
  const delays = [0, 200, 400];
  dots.forEach((dot, i) => {
    if (!dot) return;
    setTimeout(() => {
      let rising = true;
      const interval = setInterval(() => {
        if (!document.getElementById(`agis-dot-${dt}-${i}`)) {
          clearInterval(interval);
          return;
        }
        const current = parseFloat(dot.style.opacity) || 0;
        if (rising) {
          dot.style.opacity = Math.min(1, current + 0.15);
          if (parseFloat(dot.style.opacity) >= 1) rising = false;
        } else {
          dot.style.opacity = Math.max(0, current - 0.1);
          if (parseFloat(dot.style.opacity) <= 0) rising = true;
        }
      }, 50);
      window._agisThinkingIntervals[`${dt}-${i}`] = interval;
    }, delays[i]);
  });

  jQuery('#chatMessages').scrollTop(jQuery('#chatMessages')[0].scrollHeight);
};


const replaceThinkingWithReply = (dt, text) => {
  if (window._agisThinkingIntervals) {
    [0, 1, 2].forEach(i => {
      const key = `${dt}-${i}`;
      if (window._agisThinkingIntervals[key]) {
        clearInterval(window._agisThinkingIntervals[key]);
        delete window._agisThinkingIntervals[key];
      }
    });
  }
  const agentMessageId = `Agent_${dt}`;
  const el = jQuery('#' + agentMessageId);
  if (el.length) {
    el.html(`<strong>Assistant:</strong> ${text}`);
  } else {
    appendMessage(dt, 'ai', text);
  }
  jQuery('#chatMessages').scrollTop(jQuery('#chatMessages')[0].scrollHeight);

  if (window.ChatStorage) {
    ChatStorage.saveMessage({
      id: `Agent_${dt}`,
      domain: chatDomain,
      sender: 'ai',
      text: text,
      timestamp: dt + 1
    })
      .then(() => ChatStorage.pruneOldest(chatDomain, 150))
      .catch((err) => console.error('ChatStorage: failed to save AI message', err));
  }
};

/*
const sendMessage = (text = undefined, audio = false) => {
  console.log('Inbound text: ' + text);
  console.log('Obj: ', jQuery('#chatInput'));
  console.log('Val: ' + jQuery('#chatInput').val());

  if (!text) {
    text = jQuery('#chatInput').val().trim();
  }

  console.log('sending message: ' + text);
  if (!text) return;

  const dt = Date.now();
  appendMessage(dt, 'user', text);
  jQuery('#chatInput').val('');

  jQuery.ajax({
    url: `${serverUrl}/api/talk`,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ domain: chatDomain, text, user: 'agis' }),
    success: (response) => {
      const reply = response?.message || 'No response received.';
      appendMessage(dt, 'ai', reply);
      if (audio) {
        console.log('Audio enabled');
        playAudioResponse(reply);
      }
    },
    error: () => appendMessage(Date.now(), 'ai', 'Error: Unable to connect to AI server.')
  });
};
*/

const sendMessage = (text = undefined, audio = false) => {
  console.log('Inbound text:', text);
  console.log('Input object:', jQuery('#chatInput'));
  console.log('Input value:', jQuery('#chatInput').val());

  if (!text) {
    text = jQuery('#chatInput').val().trim();
  }

  console.log('Sending message:', text);
  if (!text) return;

  const dt = Date.now();
  appendMessage(dt, 'user', text);
  jQuery('#chatInput').val('');
  showThinkingIndicator(dt);

  jQuery.ajax({
    url: `${serverUrl}/api/talk`,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      domain: chatDomain,
      text: text,
      user: 'agis'
    }),
    success: (response) => {
      console.log('AI /api/talk raw response:', response);

      let reply = '';

      if (typeof response === 'string') {
        reply = response;
      } else if (response && typeof response === 'object') {
        reply =
          response.message ||
          response.response ||
          response.reply ||
          response.text ||
          response.answer ||
          response.output ||
          '';
      }

      if (!reply || String(reply).trim() === '') {
        reply = 'No response received.';
      }

      replaceThinkingWithReply(dt, reply);

      if (audio) {
        console.log('Audio enabled');
        playAudioResponse(reply);
      }
    },
    error: (xhr, status, err) => {
      console.error('Error calling /api/talk:', {
        status: status,
        error: err,
        httpStatus: xhr?.status,
        responseText: xhr?.responseText
      });

      let errorMessage = 'Error: Unable to connect to AI server.';
      if (xhr?.responseText) {
        errorMessage += ` (${xhr.responseText})`;
      }

      replaceThinkingWithReply(dt, errorMessage);
    }
  });
};

const enlargeChat = () => {
  jQuery('#chatContainer').animate({
    width: '650px',
    height: '500px'
  }, 300).css('max-width', '95%');

  isEnlarged = true;
  jQuery('#enlargeModeBtn').hide();
  jQuery('#smallModeBtn').show();
};

const smallChat = () => {
  jQuery('#chatContainer').animate({
    width: '350px',
    height: '400px'
  }, 300);

  isEnlarged = false;
  jQuery('#smallModeBtn').hide();
  jQuery('#enlargeModeBtn').show();
};

const checkIsLive = (domainOverride = undefined) => {
  let domain = domainOverride || `${window.location.hostname}`.replace('www.', '');
  console.log('checkIsLive Domain: ' + domain);

  jQuery.ajax({
    url: `${serverUrl}/api/isLive`,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ domain }),
    success: async (response) => {
      console.log('Islive Response:', response);
      if (response.live === true) {
        await renderChatHtml(domain, { autoShowMinimized: true });
      }
    },
    error: () => {
      console.error('Error: Unable to check isLive status.');
    }
  });
};

const setChatClientLookAndFeel = (payload) => {
  console.log('Setting setChatClientLookAndFeel:', payload);
  if (!payload) {
    return;
  }

  const hasAnyChatMessages = jQuery('#chatMessages .agis-user-message, #chatMessages .agis-ai-message').length > 0;
  if (!hasAnyChatMessages) {
    const startText = String(payload.startConversationText || 'Start the conversation...').trim() || 'Start the conversation...';
    const existing = jQuery('#chatStartMessage');
    if (existing.length) {
      existing.text(startText);
    } else {
      jQuery('#chatMessages').prepend(`<div class="agis-text-muted agis-text-center" id="chatStartMessage"></div>`);
      jQuery('#chatStartMessage').text(startText);
    }
  }

  let minimizedIconPlacement = payload.minimizedIconPlacement || 'BottomRight';
  let chatRightOffset = payload.chatRightOffset || 15;
  let chatLeftOffset = payload.chatLeftOffset || 0;
  let chatBottomOffset = payload.chatBottomOffset || 15;

  if (minimizedIconPlacement === 'BottomRight') {
    jQuery('#chatContainer').css('bottom', chatBottomOffset + 'px');
    jQuery('#chatContainer').css('left', '');
    jQuery('#chatContainer').css('right', chatRightOffset + 'px');
  }

  if (minimizedIconPlacement === 'BottomLeft') {
    jQuery('#chatContainer').css('bottom', chatBottomOffset + 'px');
    jQuery('#chatContainer').css('right', '');
    let adminOffset = 0;
    if (window.location.pathname.indexOf('wp-admin') >= 0) {
      adminOffset = 150;
    }
    jQuery('#chatContainer').css('left', (adminOffset + parseInt(chatLeftOffset, 10)) + 'px');
  }
};

const applyMinimizedIconLayout = (isMobile, params) => {
  const {
    minimizedIconPlacement,
    minimizedIconWidth, minimizedIconHeight,
    minimizedIconWidthMobile, minimizedIconHeightMobile,
    minimizedIconRightOffset, minimizedIconRightOffsetMobile,
    minimizedIconLeftOffset, minimizedIconLeftOffsetMobile,
    minimizedIconBottomOffset, minimizedIconBottomOffsetMobile,
  } = params;

  const width  = isMobile ? minimizedIconWidthMobile  : minimizedIconWidth;
  const height = isMobile ? minimizedIconHeightMobile : minimizedIconHeight;
  const bottom = isMobile ? minimizedIconBottomOffsetMobile : minimizedIconBottomOffset;

  jQuery('#minimizedChatContainer').css('width',  width  + 'px');
  jQuery('#minimizedChatContainer').css('height', height + 'px');
  jQuery('#minimizedChatContainer').css('bottom', bottom + 'px');

  if (minimizedIconPlacement === 'BottomRight') {
    const right = isMobile ? minimizedIconRightOffsetMobile : minimizedIconRightOffset;
    jQuery('#minimizedChatContainer').css('right', right + 'px');
    jQuery('#minimizedChatContainer').css('left', '');
  }

  if (minimizedIconPlacement === 'BottomLeft') {
    const left = isMobile ? minimizedIconLeftOffsetMobile : minimizedIconLeftOffset;
    let adminOffset = 0;
    if (window.location.pathname.indexOf('wp-admin') >= 0) {
      adminOffset = 150;
    }
    jQuery('#minimizedChatContainer').css('left', (adminOffset + parseInt(left, 10)) + 'px');
    jQuery('#minimizedChatContainer').css('right', '');
  }
};

const setMinimizedChatLookAndFeel = (payload) => {
  if (!payload) {
    return;
  }

  console.log('Setting setMinimizedChatLookAndFeel:', payload);

  const minimizedIconPlacement      = payload.minimizedIconPlacement || 'BottomRight';
  const minimizedIconWidth          = payload.minimizedIconWidth || 100;
  const minimizedIconHeight         = payload.minimizedIconHeight || 100;
  const minimizedIconWidthMobile    = payload.minimizedIconWidthMobile || minimizedIconWidth;
  const minimizedIconHeightMobile   = payload.minimizedIconHeightMobile || minimizedIconHeight;
  const minimizedIconRightOffset    = payload.minimizedIconRightOffset || 63;
  const minimizedIconRightOffsetMobile = payload.minimizedIconRightOffsetMobile !== undefined ? payload.minimizedIconRightOffsetMobile : minimizedIconRightOffset;
  const minimizedIconLeftOffset     = payload.minimizedIconLeftOffset || 0;
  const minimizedIconLeftOffsetMobile  = payload.minimizedIconLeftOffsetMobile !== undefined ? payload.minimizedIconLeftOffsetMobile : minimizedIconLeftOffset;
  const minimizedIconBottomOffset   = payload.minimizedIconBottomOffset || 63;
  const minimizedIconBottomOffsetMobile = payload.minimizedIconBottomOffsetMobile !== undefined ? payload.minimizedIconBottomOffsetMobile : minimizedIconBottomOffset;

  const params = {
    minimizedIconPlacement,
    minimizedIconWidth, minimizedIconHeight,
    minimizedIconWidthMobile, minimizedIconHeightMobile,
    minimizedIconRightOffset, minimizedIconRightOffsetMobile,
    minimizedIconLeftOffset, minimizedIconLeftOffsetMobile,
    minimizedIconBottomOffset, minimizedIconBottomOffsetMobile,
  };

  const mq = window.matchMedia('(max-width: 767px)');
  applyMinimizedIconLayout(mq.matches, params);

  if (window._agisMinimizedIconMqListener) {
    window._agisMinimizedMq.removeEventListener('change', window._agisMinimizedIconMqListener);
  }
  window._agisMinimizedIconMqListener = (e) => applyMinimizedIconLayout(e.matches, params);
  window._agisMinimizedMq = mq;
  mq.addEventListener('change', window._agisMinimizedIconMqListener);
};

const applyMessageBubbleStyles = () => {
  const hasAny = userMessagePadding !== null || userMessageBorderRadius !== null ||
                 userMessageBubbleTail || aiMessagePadding !== null ||
                 aiMessageBorderRadius !== null || aiMessageBubbleTail;
  if (!hasAny) {
    const existing = document.getElementById('agis-message-bubble-style');
    if (existing) existing.remove();
    return;
  }
  let el = document.getElementById('agis-message-bubble-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'agis-message-bubble-style';
    document.head.appendChild(el);
  }
  const userPaddingRule    = userMessagePadding !== null        ? `padding: ${userMessagePadding}px;` : '';
  const userRadiusRule     = userMessageBorderRadius !== null   ? `border-radius: ${userMessageBorderRadius}px;` : '';
  const aiPaddingRule      = aiMessagePadding !== null          ? `padding: ${aiMessagePadding}px;` : '';
  const aiRadiusRule       = aiMessageBorderRadius !== null     ? `border-radius: ${aiMessageBorderRadius}px;` : '';
  const userBgColor        = userMsgBgColor || 'transparent';
  const aiBgColor          = aiMsgBgColor  || 'transparent';
  el.textContent = [
    `#agis-chat-root .agis-user-message { position: relative; ${userPaddingRule} ${userRadiusRule} }`,
    `#agis-chat-root .agis-ai-message  { position: relative; ${aiPaddingRule} ${aiRadiusRule} }`,
    `#agis-chat-root .agis-user-message::after {`,
    `  content: ${userMessageBubbleTail ? "''" : 'none'};`,
    `  position: absolute; right: -8px; top: 50%; transform: translateY(-50%);`,
    `  width: 0; height: 0;`,
    `  border: 8px solid transparent;`,
    `  border-left-color: ${userBgColor};`,
    `  border-right-width: 0;`,
    `}`,
    `#agis-chat-root .agis-ai-message::before {`,
    `  content: ${aiMessageBubbleTail ? "''" : 'none'};`,
    `  position: absolute; left: -8px; top: 50%; transform: translateY(-50%);`,
    `  width: 0; height: 0;`,
    `  border: 8px solid transparent;`,
    `  border-right-color: ${aiBgColor};`,
    `  border-left-width: 0;`,
    `}`,
  ].join('\n');
};

const setChatLookAndFeel = (payload, voiceConfig = undefined) => {
  if (!payload) {
    payload = { domain: chatDomain };
    payload.chatTitle = 'Chat with AI';
    payload.headerBackgroundColor = '#49576b';
    payload.headerColor = '#eaf2ff';
    payload.chatBackgroundColor = '#081827';
    payload.userFontColor = '#eaf2ff';
    payload.aiFontColor = '#eaf2ff';
    payload.userTextBackgroundColor = '#1a2c42';
    payload.aiTextBackgroundColor = '#122238';
    payload.sendButtonColor = '#4aa2d9';
    payload.chatMessageBackgroundColor = '#0f1b2b';
    payload.chatInputPlaceholderFontColor = '#9db0c6';
    payload.chatLinkFontColor = '#76d949';
    payload.chatContainerBorderWidth = 0;
    payload.chatContainerBorderColor = '#2a3a4d';
    payload.chatContainerBorderRadius = 0;
    payload.chatInputFontColor = '#eaf2ff';
    payload.sendButtonFontColor = '#ffffff';
    payload.sendButtonBorderRadius = 8;
    payload.sendButtonPadding = 12;
    payload.userMessagePadding = 8;
    payload.userMessageBorderRadius = 4;
    payload.userMessageBubbleTail = true;
    payload.aiMessagePadding = 8;
    payload.aiMessageBorderRadius = 4;
    payload.aiMessageBubbleTail = true;
  }

  console.log('Setting look and feel:', payload);

  if (payload.chatTitle) {
    console.log('Updating header text to ' + payload.chatTitle);
    jQuery('#chatContainer .agis-card-header span').html(payload.chatTitle);
  }

  if (!voiceConfig || voiceConfig.enabled !== true) {
    jQuery('#recordButton').hide();
  } else {
    jQuery('#recordButton').show();
  }

  if (userTesting) {
    let currentUserTest = getCookie('currentUserTest');
    if (!currentUserTest) {
      alert('Please select a test to submit this question to');
      return;
    }
    jQuery('#chatContainer .agis-card-header span').html(payload.chatTitle + ' <i>(Test Mode)</i><br><b>' + payload.domain + '</b><br>Test:' + currentUserTest);
  }

  if (payload.headerColor) {
    jQuery('#chatContainer .agis-card-header').css('color', payload.headerColor);
  }
  if (payload.headerBackgroundColor) {
    jQuery('#chatContainer .agis-card-header').css('background-color', payload.headerBackgroundColor);
  }
  if (payload.chatBackgroundColor) {
    jQuery('#chatContainer .agis-card-body').css('background-color', payload.chatBackgroundColor);
  }
  if (payload.userFontColor) {
    userMsgFontColor = payload.userFontColor;
    jQuery('#chatContainer .agis-user-message').css('color', userMsgFontColor);
  }
  if (payload.aiFontColor) {
    aiMsgFontColor = payload.aiFontColor;
    jQuery('#chatContainer .agis-ai-message').css('color', aiMsgFontColor);
  }
  if (payload.userTextBackgroundColor) {
    userMsgBgColor = payload.userTextBackgroundColor;
    jQuery('#chatContainer .agis-user-message').css('background-color', userMsgBgColor);
    applyMessageBubbleStyles();
  }
  if (payload.aiTextBackgroundColor) {
    aiMsgBgColor = payload.aiTextBackgroundColor;
    jQuery('#chatContainer .agis-ai-message').css('background-color', aiMsgBgColor);
    applyMessageBubbleStyles();
  }
  if (payload.chatMessageBackgroundColor) {
    jQuery('#chatContainer .agis-card-footer').css('background-color', payload.chatMessageBackgroundColor);
  }
  if (payload.fontSize) {
    chatMsgFontSize = payload.fontSize;
    jQuery('#chatContainer .agis-user-message, #chatContainer .agis-ai-message').css('font-size', chatMsgFontSize + 'px');
  }
  if (payload.chatInputPlaceholderFontColor) {
    applyChatInputPlaceholderFontColor(payload.chatInputPlaceholderFontColor);
  }
  if (payload.chatLinkFontColor) {
    applyChatLinkFontColor(payload.chatLinkFontColor);
  }
  if (payload.chatInputFontColor) {
    chatInputFontColor = payload.chatInputFontColor;
    applyChatInputFontColor(chatInputFontColor);
  }
  let sendBtnChanged = false;
  if (payload.sendButtonColor !== undefined) { sendBtnBgColor = payload.sendButtonColor; sendBtnChanged = true; }
  if (payload.sendButtonFontColor !== undefined) { sendButtonFontColor = payload.sendButtonFontColor; sendBtnChanged = true; }
  if (payload.sendButtonBorderRadius !== undefined) { sendButtonBorderRadius = parseInt(payload.sendButtonBorderRadius, 10); if (isNaN(sendButtonBorderRadius)) sendButtonBorderRadius = null; sendBtnChanged = true; }
  if (payload.sendButtonPadding !== undefined) { sendButtonPadding = parseInt(payload.sendButtonPadding, 10); if (isNaN(sendButtonPadding)) sendButtonPadding = null; sendBtnChanged = true; }
  if (sendBtnChanged) applySendButtonStyles();
  if (payload.chatContainerBorderWidth !== undefined || payload.chatContainerBorderColor !== undefined || payload.chatContainerBorderRadius !== undefined) {
    jQuery('#chatContainer').css('border-style', 'solid');
  }
  if (payload.chatContainerBorderWidth !== undefined) {
    let w = parseInt(payload.chatContainerBorderWidth, 10);
    if (isNaN(w)) w = 0;
    jQuery('#chatContainer').css('border-width', w + 'px');
  }
  if (payload.chatContainerBorderColor !== undefined) {
    jQuery('#chatContainer').css('border-color', payload.chatContainerBorderColor);
  }
  if (payload.chatContainerBorderRadius !== undefined) {
    let r = parseInt(payload.chatContainerBorderRadius, 10);
    if (isNaN(r)) r = 0;
    jQuery('#chatContainer').css('border-radius', r + 'px');
  }

  let bubbleChanged = false;
  if (payload.userMessagePadding !== undefined) { userMessagePadding = parseInt(payload.userMessagePadding, 10); bubbleChanged = true; }
  else if (userMessagePadding === null) { userMessagePadding = 8; bubbleChanged = true; }
  if (payload.userMessageBorderRadius !== undefined) { userMessageBorderRadius = parseInt(payload.userMessageBorderRadius, 10); bubbleChanged = true; }
  else if (userMessageBorderRadius === null) { userMessageBorderRadius = 4; bubbleChanged = true; }
  if (payload.userMessageBubbleTail !== undefined) { userMessageBubbleTail = payload.userMessageBubbleTail === true || payload.userMessageBubbleTail === 'true'; bubbleChanged = true; }
  else if (userMessageBubbleTail === false) { userMessageBubbleTail = true; bubbleChanged = true; }
  if (payload.aiMessagePadding !== undefined) { aiMessagePadding = parseInt(payload.aiMessagePadding, 10); bubbleChanged = true; }
  else if (aiMessagePadding === null) { aiMessagePadding = 8; bubbleChanged = true; }
  if (payload.aiMessageBorderRadius !== undefined) { aiMessageBorderRadius = parseInt(payload.aiMessageBorderRadius, 10); bubbleChanged = true; }
  else if (aiMessageBorderRadius === null) { aiMessageBorderRadius = 4; bubbleChanged = true; }
  if (payload.aiMessageBubbleTail !== undefined) { aiMessageBubbleTail = payload.aiMessageBubbleTail === true || payload.aiMessageBubbleTail === 'true'; bubbleChanged = true; }
  else if (aiMessageBubbleTail === false) { aiMessageBubbleTail = true; bubbleChanged = true; }
  if (bubbleChanged) applyMessageBubbleStyles();
};

const applyChatInputPlaceholderFontColor = (color) => {
  if (!color) return;
  let el = document.getElementById('agis-chat-input-placeholder-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'agis-chat-input-placeholder-style';
    document.head.appendChild(el);
  }
  const base = '#agis-chat-root #chatInput';
  el.textContent =
    `${base}::placeholder{color:${color}!important;opacity:1;}` +
    `${base}::-webkit-input-placeholder{color:${color}!important;opacity:1;}` +
    `${base}::-moz-placeholder{color:${color}!important;opacity:1;}` +
    `${base}:-ms-input-placeholder{color:${color}!important;}`;
};

const applyChatLinkFontColor = (color) => {
  if (!color) return;
  let el = document.getElementById('agis-chat-href-font-color-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'agis-chat-href-font-color-style';
    document.head.appendChild(el);
  }
  el.textContent = '#agis-chat-root a{color:' + color + '!important;}';
};

const applyChatInputFontColor = (color) => {
  if (!color) return;
  let el = document.getElementById('agis-chat-input-font-color-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'agis-chat-input-font-color-style';
    document.head.appendChild(el);
  }
  el.textContent = '#agis-chat-root #chatInput{color:' + color + '!important;}';
};

const applySendButtonStyles = () => {
  let el = document.getElementById('agis-send-btn-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'agis-send-btn-style';
    document.head.appendChild(el);
  }
  const sel = '#agis-chat-root #sendMessageBtn';
  const rules = [];
  if (sendBtnBgColor !== null) rules.push('background-color:' + sendBtnBgColor + '!important;');
  if (sendButtonFontColor !== null) rules.push('color:' + sendButtonFontColor + '!important;');
  if (sendButtonBorderRadius !== null) rules.push('border-radius:' + sendButtonBorderRadius + 'px!important;');
  if (sendButtonPadding !== null) rules.push('padding:' + sendButtonPadding + 'px!important;');
  el.textContent = rules.length ? sel + '{' + rules.join('') + '}' : '';
};

const setupRecorder = async (domain) => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function (event) {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = function () {
    audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];
    submitAudioRecording(domain, audioBlob);
  };
};

const submitAudioRecording = async (domain, audioBlobValue) => {
  console.log('Submitting audio for domain: ' + domain);
  console.log('Audio blob size:', audioBlobValue.size);

  const formData = new FormData();
  formData.append('audio', audioBlobValue, 'recording.m4a.html');
  formData.append('domain', domain);

  for (let pair of formData.entries()) {
    console.log(pair[0] + ', ' + pair[1]);
  }

  jQuery.ajax({
    url: `${serverUrl}/api/uploadAudio`,
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: (response) => {
      console.log('Transcription:', response.transcription);
      let responseText = response.transcription.text;
      console.log('Sending message {1} - submitAudioRecording');
      sendMessage(responseText, true);
    },
    error: () => alert('Error: Unable to transcribe audio.')
  });
};

const getDomainVoiceID = async () => {
  let payload = await getLookAndFeelData(chatDomain);
  console.log('Got payload:', payload);
  if (payload.voice) {
    voiceID = payload.voice.labId;
  } else {
    voiceID = 'Gqga0DQ4bCPX2wEpVPwy';
  }
};

const playAudioResponse = (text) => {
  console.log('Playing audio response: ' + text);
  if (!voiceID) {
    getDomainVoiceID();
  }
  generateAndPlayAudio(chatDomain, voiceID, text);
};

const generateAndPlayAudio = async (domain, labId, text) => {
  console.log('Generating audio for domain: ' + domain + ' as ' + text);

  jQuery.ajax({
    url: `${serverUrl}/api/generateAudio`,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ domain: domain, text: text, voiceID: labId }),
    success: (response) => {
      console.log('Got response file:', response.url);
      let audioUrl = iconUrl + response.url;
      console.log('URL: ' + audioUrl);

      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('Audio playback failed:', err);
      });
    },
    error: () => alert('Error: Unable to generate audio.')
  });
};

const initAgisChat = async (config = {}) => {
  try {
    if (config.serverUrl) {
      window.serverUrl = config.serverUrl;
    }
    if (config.iconUrl) {
      window.iconUrl = config.iconUrl;
    }

    const requestedDomain =
      config.domain ||
      window.AGISChatConfig?.domain ||
      window.location.hostname.replace(/^www\./, '');

    const shouldCheckIsLive = config.checkIsLive !== false;

    if (!window.serverUrl || !window.iconUrl) {
      console.error('AGIS Chat init failed: serverUrl or iconUrl is missing.');
      return;
    }

    chatDomain = requestedDomain;

    if (shouldCheckIsLive) {
      checkIsLive(requestedDomain);
    } else {
      await renderChatHtml(requestedDomain, { autoShowMinimized: true });
    }
  } catch (err) {
    console.error('AGIS Chat init failed:', err);
  }
};

window.renderChatHtml = renderChatHtml;
window.showChat = showChat;
window.openChatFromMinimized = openChatFromMinimized;
window.initAgisChat = initAgisChat;
