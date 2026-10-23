// accounts.js
console.log('AGIS AI - LookAndFeel Loaded')
const lookAndFeelEntry = () => {
	console.log('Doing lookAndFeelEntry')
	jQuery('#content-area').html(lookAndFeelOptionsHtml);
  populateDomainSelect()
  setSection('lookAndFeel');
}

const getLookAndFeelDomain = () => {
  const urlDomain = new URLSearchParams(window.location.search).get('domain');
  return urlDomain || getCookie('domain');
};

const loadSection_LookAndFeel = (sectionName) => {
  setSubSection(sectionName);
  const domain = getLookAndFeelDomain();
  console.log('In loadSection_LookAndFeel with sectionName: ' + sectionName + ' domain: ' + domain);
  switch (sectionName) {
    case "Behavior":
      renderChatHtml(domain);
      renderChatboxBehavior();
      return;

    case "Appearance":
      renderChatHtml(domain);
      renderAppearance();
      return;

    case "ViewDomains":
    default:
      if (domain) {
        showChat(domain);
      }
      return;
  }
}
const renderChatboxBehavior = async() => {
  jQuery("#main-contents").html(chatbotBehaviorOptionsHtml)
  let domain = getLookAndFeelDomain();
  jQuery('#lookAndFeelTitle').html('Chatbox Configuration for: ' + domain)
  console.log('Show chat from renderChatboxBehavior for ' + domain)
  console.log('iconUrl: ' + iconUrl)
  chatBoxLookAndFeel = await getLookAndFeelData(domain);
  await wait(750)
  await showChatMinimized(domain, chatBoxLookAndFeel.chatIcon);
  await wait(350)
  propogateChatBehaviorToInputs();
}

const updateMinimizedChatLookAndFeel = (field) => {
  console.log('Updating field: ' + field);
  let newVal = jQuery(`#${field}`).val();
  console.log('New value: ' + newVal)
  if (!chatBoxLookAndFeel['behavior']) {
    chatBoxLookAndFeel['behavior'] = {}
  }
  chatBoxLookAndFeel['behavior'][field] = newVal;
  setMinimizedChatLookAndFeel(chatBoxLookAndFeel['behavior'])
}

const updateChatClientLookAndFeel = (field) => {
  console.log('Updating field: ' + field);
  let newVal = jQuery(`#${field}`).val();
  console.log('New value: ' + newVal)
  if (!chatBoxLookAndFeel['behavior']) {
    chatBoxLookAndFeel['behavior'] = {}
  }
  chatBoxLookAndFeel['behavior'][field] = newVal;
  setChatClientLookAndFeel(chatBoxLookAndFeel['behavior'])
}

const showMinimizedIconUpload = () => {
  console.log('Processing icon upload')
  showModal('Upload a new chat icon', uploadImageHtml)
  setupImageUploadListeners();
}

const propogateChatBehaviorToInputs = async() => {
  const domain = getLookAndFeelDomain();
  if (!chatBoxLookAndFeel) {
    chatBoxLookAndFeel = await getLookAndFeelData(domain);
  }

  //console.log('Look and feel data:', chatBoxLookAndFeel)
  let icon = chatBoxLookAndFeel.chatIcon || '/admin/chatIconDefault.png'
  let fullIconUrl = iconUrl + icon;
  jQuery('#minimizedIcon').attr('src', fullIconUrl);
  if (!chatBoxLookAndFeel['behavior']) {
    //console.log('No behavior yet');
    return;
  }
  //console.log('Behavior: ', chatBoxLookAndFeel['behavior'])
  for (var key in chatBoxLookAndFeel['behavior']) {
    let value = chatBoxLookAndFeel['behavior'][key];
   // console.log('Key: ' + key);
    jQuery(`#${key}`).val(value);
  }
  if (chatBoxLookAndFeel['behavior']['minimizedIconByDefault'] == true) {
    jQuery('#minimizedIconByDefault').prop('checked', true);
  } else {
      jQuery('#minimizedIconByDefault').prop('checked', false);
  }
  
}

const renderAppearance = async() => {
  jQuery("#main-contents").html(lookAndFeelInnerOptionsHtml)
  let domain = getLookAndFeelDomain();
  jQuery('#lookAndFeelTitle').html('Chat Client Configuration for: ' + domain)
  console.log('Show chat from renderAppearance for ' + domain)
  await wait(750)
  await showChat(domain);
  await wait(350)
  propogateChatValuesToInputs();
}

const saveChatBehavior = () => {
  let fieldsToPersist = [
    'startConversationText',
    'minimizedIconPlacement',
    'minimizedIconWidth',
    'minimizedIconHeight',
    'minimizedIconWidthMobile',
    'minimizedIconHeightMobile',
    'minimizedIconRightOffset',
    'minimizedIconRightOffsetMobile',
    'minimizedIconLeftOffset',
    'minimizedIconLeftOffsetMobile',
    'minimizedIconTopOffset',
    'minimizedIconBottomOffset',
    'minimizedIconBottomOffsetMobile',
    'chatRightOffset',
    'chatLeftOffset',
    'chatTopOffset',
    'chatBottomOffset'
    ];
  let newBehaviors = {};
  _.each(fieldsToPersist, function(row) {
    newBehaviors[row] = jQuery(`#${row}`).val();
  })
  newBehaviors['minimizedIconByDefault'] = jQuery('#minimizedIconByDefault').is(":checked");
  console.log('New behavior payload:', newBehaviors);
  let postUrl = `${serverUrl}/api/saveBehavior`
  console.log('Using postUrl:' + postUrl)
  const domain = getLookAndFeelDomain();
  if (!domain) {
    alert('Got to save without domain!');
    return;
  }
  console.log('Domain:' + domain)
   jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ domain, behavior: newBehaviors }),
      success: function(data) {
          alert('Changes saved')
      },
      error: function(xhr, status, error) {
          console.error('Error fetching domains:', error);
          alert('An error occurred while fetching domains.');
      }
  });
}

const paintDomainsForAISentiment = (data) => {
  console.log('Painting domains: ', data);

    // Create the table structure
    let tableHtml = `
        <table class="table table-striped table-bordered">
            <thead class="table-dark">
                <tr>
                    <th>Domain</th>
                    <th>Sentiment Enabled</th>
                    <th>Options</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Populate the table rows with data
    _.each(data, function (row) {
        console.log('Iterating row:', row);
        let sentimentEnabledOption = false;
        let sentimentEnabledOptionText = "Enable Sentiment"
        let sentimentEnabledOptionDiv = "Sentiment Disabled"

        console.log('Row:', row)
        if (row['sentiment']==true) {
          sentimentEnabledOption = row['sentiment'];
        }
        let oppositeEnableOption = !sentimentEnabledOption;
        if (sentimentEnabledOption) {
          sentimentEnabledOptionText = 'Disable Sentiment'
          sentimentEnabledOptionDiv = "Sentiment Enabled"
        }
        tableHtml += `
            <tr>
                <td>${row.domain}</td>
                <td>${sentimentEnabledOptionDiv}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="updateSentimentEnabled('${row.domain}', ${oppositeEnableOption})">${sentimentEnabledOptionText}</button>
                    <button class="btn btn-info btn-sm" onclick="showChat('${row.domain}')">Test</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    // Render the table into a container with id "vectorDBContainer"
    jQuery('#main-contents').html(tableHtml);
}

const paintDomainsForAIIntent = (domains) => {
    let tableHtml = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Domain</th>
                    <th>Intent Categories</th>
                    <th>Options</th>
                </tr>
            </thead>
            <tbody>`;
            
    domains.forEach(domainObj => {
        const intentCategories = domainObj.intentCategories || [];
        const domainName = domainObj.domain || domainObj.name || 'Unknown Domain';
        
        // Create a nice display of categories
        let categoryDisplay;
        if (intentCategories.length === 0) {
            categoryDisplay = '<span class="badge badge-secondary" style="color: black;">No categories</span>';
        } else {
            const categoryBadges = intentCategories.map(cat => 
                `<span class="badge badge-info mr-1" style="color: black;">${cat}</span>`
            ).join('');
            categoryDisplay = categoryBadges;
        }
        
        tableHtml += `
            <tr>
                <td>${domainName}</td>
                <td>
                    ${categoryDisplay}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="manageIntentCategories('${domainName}', '${domainName}')">
                        Manage Categories
                    </button>
                </td>
            </tr>`;
    });
    
    tableHtml += `
            </tbody>
        </table>`;

    jQuery('#main-contents').html(tableHtml);
}

const updateSentimentEnabled = async(domain, enabled) => {
  return new Promise((resolve) => { 
    console.log('Enabling audio for domain:' + domain);
    let postUrl = `${serverUrl}/api/updateSentimentEnabled`
    console.log('Using postUrl:' + postUrl)
    jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ domain: domain, enabled: enabled }),
      success: function(data) {
        hideModal();
        renderSelectDomainForAISentiment();
        // Also refresh intent list if we're on that tab
        if (jQuery('#AIIntent').hasClass('active')) {
          renderSelectDomainForAIIntent();
        }
      },
      error: function(xhr, status, error) {
        console.error('Error fetching voices:', error);
        alert('An error occurred while fetching voices.');
        resolve([])
      }
    });
  })
}

const renderSelectDomainForAISentiment = async() => {
  let data = await getDomainsByAccount();
  console.log('In renderSelectDomainForAISentiment')
  let postUrl = `${serverUrl}/api/getDomainsByAccountWithSentiment`
  console.log('Using postUrl:' + postUrl)
   jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ account: account }),
      success: function(data) {
          console.log('Got domains data:', data)
          paintDomainsForAISentiment(data);
      },
      error: function(xhr, status, error) {
          console.error('Error fetching domains:', error);
          alert('An error occurred while fetching domains.');
      }
  });
}

const renderSelectDomainForAIIntent = async() => {
  let data = await getDomainsByAccount();
  console.log('In renderSelectDomainForAIIntent')
  let postUrl = `${serverUrl}/api/getDomainsByAccountWithSentiment` // Using same endpoint since intent depends on sentiment
  console.log('Using postUrl:' + postUrl)
   jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ account: account }),
      success: function(data) {
          console.log('Got domains data:', data)
          paintDomainsForAIIntent(data);
      },
      error: function(xhr, status, error) {
          console.error('Error fetching domains:', error);
          alert('An error occurred while fetching domains.');
      }
  });
}
const renderSelectDomainForAIAudio = async() => {
  let data = await getDomainsByAccount();
  let postUrl = `${serverUrl}/api/getDomainsByAccountWithVoice`
  console.log('Using postUrl:' + postUrl)
   jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ account: account }),
      success: function(data) {
          console.log('Got domains data:', data)
          paintDomainsForAIAudio(data);
      },
      error: function(xhr, status, error) {
          console.error('Error fetching domains:', error);
          alert('An error occurred while fetching domains.');
      }
  });
}
const renderSelectDomainForAIConfig = async() => {
  if (typeof isWordpress !== 'undefined' && isWordpress && typeof ensureWordpressAccountAndCookie === 'function') {
    await ensureWordpressAccountAndCookie();
  }
  const resolvedAccount = typeof getResolvedAccountId === 'function' ? getResolvedAccountId() : account;
  let postUrl = `${serverUrl}/api/getDomainsByAccount`;
  console.log('Using postUrl:' + postUrl);
  jQuery.ajax({
    url: postUrl,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ account: resolvedAccount }),
    success: function(data) {
      // Render the domain AI config table inside the container
      //paintDomainsForAISentiment(data);
      paintDomainsForAIConfig(data);
    },
    error: function(xhr, status, error) {
      console.error('Error fetching domains:', error);
      jQuery('#domainAIConfigList').html('<p class="text-danger">Error loading domains.</p>');
    }
  });
}


const paintDomainsForAIAudio = (data) => {
  console.log('Painting domains: ', data);

    // Create the table structure
    let tableHtml = `
        <table class="table table-striped table-bordered">
            <thead class="table-dark">
                <tr>
                    <th>Domain</th>
                    <th>Voice</th>
                    <th>Audio Enabled</th>
                    <th>Options</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Populate the table rows with data
    _.each(data, function (row) {
       // console.log('Iterating row:', row);
        let audioEnabledOption = false;
        let audioEnabledOptionText = "Enable Audio"
        let audioEnabledOptionDiv = "Audio Disabled"
        let voiceOption = "Not Selected"
        //console.log('Row:', row)
        if (row['voice']) {
          audioEnabledOption = row['voice']['enabled'];
          voiceOption = row['voice'].name + ' - ' + row['voice'].description;
        }
        let oppositeEnableOption = !audioEnabledOption;
        if (audioEnabledOption) {
          audioEnabledOptionText = 'Disable Audio'
          audioEnabledOptionDiv = "Audio Enabled"
        }
        tableHtml += `
            <tr>
                <td>${row.domain}</td>
                <td>${voiceOption}</td>
                <td>${audioEnabledOptionDiv}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="showSelectVoice('${row.domain}')">Select Voice</button>
                    <button class="btn btn-info btn-sm" onclick="updateVoiceEnabled('${row.domain}', ${oppositeEnableOption})">${audioEnabledOptionText}</button>
                    <button class="btn btn-info btn-sm" onclick="showChat('${row.domain}')">Test</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    // Render the table into a container with id "vectorDBContainer"
    jQuery('#main-contents').html(tableHtml);
    let serverNotification = getCookie('serverNotification');
    if (serverNotification) {
      if (serverNotification.length>1) {
        jQuery('#serverNotification').html(serverNotification);
        setCookie('prepaymentUrl','', 1);
      }
    }
}

const paintDomainsForAIConfig = (data) => {
  console.log('Painting domains: ', data);

    // Create the table structure
    let tableHtml = `
        <table class="table table-striped table-bordered">
            <thead class="table-dark">
                <tr>
                    <th>Domain</th>
                    <th>Options</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Populate the table rows with data
    data.forEach(domain => {
        tableHtml += `
            <tr>
                <td>${domain}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="showPrompt('${domain}')">Edit Prompt</button>
                    <button class="btn btn-info btn-sm" onclick="showAlwaysIncluded('${domain}')">Always Included</button>
                    <button class="btn btn-info btn-sm" onclick="showPersonality('${domain}')">Edit Personality</button>
                    <button class="btn btn-info btn-sm" onclick="showWordCount('${domain}')">Edit Word Count</button>
                    <button class="btn btn-info btn-sm" onclick="showLanguages('${domain}')">Specify Languages</button>
                    <button class="btn btn-warning btn-sm" onclick="showChat('${domain}')">Chat</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    // Render the table into a container with id "vectorDBContainer"
    jQuery('#main-contents').html(tableHtml);
}

const paintPersonality = (domain, data) => {
  console.log('data for domain: ' + domain + ' is: ', data);
  let personality = `You are helpful and professional.
  `;
  if (data) {
    if (data.personality) {
      personality = data.personality;
    }
  }
  let promptHtml = `
  <textarea class="modalTextArea">${personality}</textarea>
  <br><center><button class="btn btn-primary" onClick="savePersonality('${domain}');">Save</button></center>
  `
  showModal('Set personality for ' + domain, promptHtml);
}

const paintLanguages = (domain, data) => {
  console.log('Languages for domain: ' + domain + ' is: ', data);
  let languages = `English`;
  if (data) {
    if (data.languages) {
      languages = data.languages;
    }
  }
  let promptHtml = `
  <textarea class="modalTextArea">${languages}</textarea>
  <div class="mt-2" style="font-size: 12px; color: #555;">Enter a comma-separated list, e.g., "English, Spanish". The bot will reply in the user's language and only switch if they ask.</div>
  <br><center><button class="btn btn-primary" onClick="saveLanguages('${domain}');">Save</button></center>
  `
  showModal('Set available languages for ' + domain, promptHtml);
}
const paintWordcount = (domain, data) => {
  console.log('Wordcount for domain: ' + domain + ' is: ', data);
  let wordcount = `Please keep your responses under 100 words.`;
  if (data) {
    if (data.wordcount) {
      wordcount = data.wordcount;
    }
  }
  let promptHtml = `
  <textarea class="modalTextArea">${wordcount}</textarea>
  <br><center><button class="btn btn-primary" onClick="saveWordcount('${domain}');">Save</button></center>
  `
  showModal('Set Wordcount Description for ' + domain, promptHtml);
}
const paintPrompt = (domain, data) => {
  console.log('Prompt for domain: ' + domain + ' is: ', data);
  let prompt = `You are an ai assistant helping users navigate a website.
  
  The user's last inquiry is #usermessage#
  Please look at the following results and give your best answer:
  -----------------
  #results#
  -----------------
  `;
  if (data) {
    if (data.prompt) {
      prompt = data.prompt;
    }
  }
  let promptHtml = `
  <textarea class="modalTextArea">${prompt}</textarea>
  <br><center><button class="btn btn-primary" onClick="savePrompt('${domain}');">Save</button></center>
  `
  showModal('Set prompt for ' + domain, promptHtml);
}
const saveAlwaysAvailable = async(domain) => {
  let alwaysAvailable = jQuery('.modalTextArea').val();
  await saveLookAndFeel(domain, 'alwaysAvailable', alwaysAvailable)
  alert('Prompt saved!');
  hideModal();
}

const savePrompt = async(domain) => {
  let prompt = jQuery('.modalTextArea').val();
  await saveLookAndFeel(domain, 'prompt', prompt)
  alert('Prompt saved!');
  hideModal();
}
const saveLanguages = async(domain) => {
  let languages = jQuery('.modalTextArea').val();
  await saveLookAndFeel(domain, 'languages', languages)
  alert('Languages saved!');
  hideModal();
}
const savePersonality = async(domain) => {
  let personality = jQuery('.modalTextArea').val();
  await saveLookAndFeel(domain, 'personality', personality)
  alert('Personality saved!');
  hideModal();
}

const saveWordcount = async(domain) => {
  let wordcount = jQuery('.modalTextArea').val();
  await saveLookAndFeel(domain, 'wordcount', wordcount)
  alert('Wordcount saved!');
  hideModal();
}

const getLookAndFeelData = (domain) => {  
  return new Promise((resolve) => { 
    let postUrl = `${serverUrl}/api/getLookAndFeel`
    console.log('Using postUrl:' + postUrl)
     jQuery.ajax({
        url: postUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ domain: domain}),
        success: function(data) {
            resolve(data)
        },
        error: function(xhr, status, error) {
            resolve(undefined);
        }
    });
  });
}

const APPEARANCE_DEFAULTS = {
    headerBackgroundColor: '#49576b',
    headerColor: '#eaf2ff',
    chatBackgroundColor: '#081827',
    chatTitle: 'Chat with AI',
    userFontColor: '#eaf2ff',
    aiFontColor: '#eaf2ff',
    userTextBackgroundColor: '#1a2c42',
    aiTextBackgroundColor: '#122238',
    sendButtonColor: '#4aa2d9',
    sendButtonFontColor: '#ffffff',
    sendButtonBorderRadius: 8,
    sendButtonPadding: 12,
    chatMessageBackgroundColor: '#0f1b2b',
    chatInputFontColor: '#eaf2ff',
    chatInputPlaceholderFontColor: '#9db0c6',
    chatLinkFontColor: '#76d949',
    chatContainerBorderWidth: 0,
    chatContainerBorderColor: '#2a3a4d',
    chatContainerBorderRadius: 0,
    userMessagePadding: 8,
    userMessageBorderRadius: 4,
    userMessageBubbleTail: true,
    aiMessagePadding: 8,
    aiMessageBorderRadius: 4,
    aiMessageBubbleTail: true,
    fontSize: 14
};

const resetAppearanceToDefaults = () => {
    if (!confirm('Reset all appearance settings to defaults? This will overwrite your custom settings.')) return;

    const d = APPEARANCE_DEFAULTS;

    jQuery('#headerBackgroundColor').val(d.headerBackgroundColor);
    jQuery('#headerColor').val(d.headerColor);
    jQuery('#chatBackgroundColor').val(d.chatBackgroundColor);
    jQuery('#chatTitle').val(d.chatTitle);
    jQuery('#userFontColor').val(d.userFontColor);
    jQuery('#aiFontColor').val(d.aiFontColor);
    jQuery('#userTextBackgroundColor').val(d.userTextBackgroundColor);
    jQuery('#aiTextBackgroundColor').val(d.aiTextBackgroundColor);
    jQuery('#sendButtonColor').val(d.sendButtonColor);
    jQuery('#sendButtonFontColor').val(d.sendButtonFontColor);
    jQuery('#sendButtonBorderRadius').val(d.sendButtonBorderRadius);
    jQuery('#sendButtonPadding').val(d.sendButtonPadding);
    jQuery('#chatMessageBackgroundColor').val(d.chatMessageBackgroundColor);
    jQuery('#chatInputFontColor').val(d.chatInputFontColor);
    jQuery('#chatInputPlaceholderFontColor').val(d.chatInputPlaceholderFontColor);
    jQuery('#chatLinkFontColor').val(d.chatLinkFontColor);
    jQuery('#chatContainerBorderWidth').val(d.chatContainerBorderWidth);
    jQuery('#chatContainerBorderColor').val(d.chatContainerBorderColor);
    jQuery('#chatContainerBorderRadius').val(d.chatContainerBorderRadius);
    jQuery('#userMessagePadding').val(d.userMessagePadding);
    jQuery('#userMessageBorderRadius').val(d.userMessageBorderRadius);
    jQuery('#userMessageBubbleTail').prop('checked', d.userMessageBubbleTail);
    jQuery('#aiMessagePadding').val(d.aiMessagePadding);
    jQuery('#aiMessageBorderRadius').val(d.aiMessageBorderRadius);
    jQuery('#aiMessageBubbleTail').prop('checked', d.aiMessageBubbleTail);
    jQuery('#fontSize').val(d.fontSize);

    setChatLookAndFeel(d);
    saveAppearance();
};

const saveAppearance = () => {
    let domain = getLookAndFeelDomain();
    if (!domain) {
        alert('No domain specified');
        return;
    }

    // Build payload from the form inputs
    let payload = {
        domain: domain,
        headerColor: jQuery('#headerColor').val(),
        headerBackgroundColor: jQuery('#headerBackgroundColor').val(),
        chatBackgroundColor: jQuery('#chatBackgroundColor').val(),
        chatTitle: jQuery('#chatTitle').val(),
        userFontColor: jQuery('#userFontColor').val(),
        aiFontColor: jQuery('#aiFontColor').val(),
        userTextBackgroundColor: jQuery('#userTextBackgroundColor').val(),
        aiTextBackgroundColor: jQuery('#aiTextBackgroundColor').val(),
        sendButtonColor: jQuery('#sendButtonColor').val(),
        chatMessageBackgroundColor: jQuery('#chatMessageBackgroundColor').val(),
        chatInputPlaceholderFontColor:  jQuery('#chatInputPlaceholderFontColor').val(),
        chatLinkFontColor: jQuery('#chatLinkFontColor').val(),
        chatInputFontColor: jQuery('#chatInputFontColor').val(),
        sendButtonFontColor: jQuery('#sendButtonFontColor').val(),
        sendButtonBorderRadius: parseInt(jQuery('#sendButtonBorderRadius').val(), 10),
        sendButtonPadding: parseInt(jQuery('#sendButtonPadding').val(), 10),
        chatContainerBorderWidth: parseInt(jQuery('#chatContainerBorderWidth').val(), 10),
        chatContainerBorderColor: jQuery('#chatContainerBorderColor').val(),
        chatContainerBorderRadius: parseInt(jQuery('#chatContainerBorderRadius').val(), 10),
        userMessagePadding: parseInt(jQuery('#userMessagePadding').val(), 10),
        userMessageBorderRadius: parseInt(jQuery('#userMessageBorderRadius').val(), 10),
        userMessageBubbleTail: jQuery('#userMessageBubbleTail').is(':checked'),
        aiMessagePadding: parseInt(jQuery('#aiMessagePadding').val(), 10),
        aiMessageBorderRadius: parseInt(jQuery('#aiMessageBorderRadius').val(), 10),
        aiMessageBubbleTail: jQuery('#aiMessageBubbleTail').is(':checked'),
        fontSize: parseInt(jQuery('#fontSize').val(), 10) || 14 // Default to 14 if empty
    };

    console.log("Saving chat appearance settings:", payload);

    // Call the API to persist settings
    api_saveAppearance(payload);
};


const api_saveAppearance = (payload) => {
  let postUrl = `${serverUrl}/api/saveAppearance`
    console.log('Using postUrl:' + postUrl)
     jQuery.ajax({
        url: postUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function(data) {
          alert('Changes saved!');
          console.log('Data:', data)
        },
        error: function(xhr, status, error) {
            console.log('Error: ', error)
        }
    });
}
const saveLookAndFeel = (domain, field, value) => {  
  return new Promise((resolve) => { 
    let postUrl = `${serverUrl}/api/saveLookAndFeelData`
    console.log('Using postUrl:' + postUrl)
     jQuery.ajax({
        url: postUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ domain, field, value }),
        success: function(data) {
            resolve(data)
        },
        error: function(xhr, status, error) {
            resolve(undefined);
        }
    });
  });
}

const showPrompt = async (domain) => {
   let lookAndFeelData = await getLookAndFeelData(domain);
   paintPrompt(domain, lookAndFeelData);
}

const showAlwaysIncluded = async (domain) => {
   let lookAndFeelData = await getLookAndFeelData(domain);
   paintAlwaysIncluded(domain, lookAndFeelData);
}

const paintAlwaysIncluded = (domain, data) => {
  console.log('Wordcount for domain: ' + domain + ' is: ', data);
  let alwaysAvailable = ``;
  if (data.alwaysAvailable) {
    alwaysAvailable = data.alwaysAvailable;
  }
  let promptHtml = `
  <textarea class="modalTextArea" value="${alwaysAvailable}">${alwaysAvailable}</textarea>
  <br><center><button class="btn btn-primary" onClick="saveAlwaysAvailable('${domain}');">Save</button></center>
  `;
  showModal('Set Always Available Data for ' + domain, promptHtml);
}

const showWordCount = async (domain) => {
   let lookAndFeelData = await getLookAndFeelData(domain);
   paintWordcount(domain, lookAndFeelData);
}

const showPersonality = async (domain) => {
   let lookAndFeelData = await getLookAndFeelData(domain);
   paintPersonality(domain, lookAndFeelData);
}

const showLanguages = async (domain) => {
   let lookAndFeelData = await getLookAndFeelData(domain);
   paintLanguages(domain, lookAndFeelData);
}

const updateChatLookAndFeel = async(field, value) => {
  let payload = {  };
  payload[field] = value;
  setChatLookAndFeel(payload);
}

const propogateChatValuesToInputs = () => {
    console.log("Extracting current chat styles...");

    const appearance = chatBoxLookAndFeel && (chatBoxLookAndFeel.appearance || chatBoxLookAndFeel);
    const D = APPEARANCE_DEFAULTS;

    jQuery('#chatTitle').val(
        (appearance && appearance.chatTitle) || D.chatTitle
    );
    jQuery('#headerBackgroundColor').val(
        (appearance && appearance.headerBackgroundColor) || D.headerBackgroundColor
    );
    jQuery('#headerColor').val(
        (appearance && appearance.headerColor) || D.headerColor
    );
    jQuery('#chatBackgroundColor').val(
        (appearance && appearance.chatBackgroundColor) || D.chatBackgroundColor
    );
    jQuery('#userFontColor').val(
        (appearance && appearance.userFontColor) || D.userFontColor
    );
    jQuery('#aiFontColor').val(
        (appearance && appearance.aiFontColor) || D.aiFontColor
    );
    jQuery('#userTextBackgroundColor').val(
        (appearance && appearance.userTextBackgroundColor) || D.userTextBackgroundColor
    );
    jQuery('#aiTextBackgroundColor').val(
        (appearance && appearance.aiTextBackgroundColor) || D.aiTextBackgroundColor
    );
    jQuery('#chatMessageBackgroundColor').val(
        (appearance && appearance.chatMessageBackgroundColor) || D.chatMessageBackgroundColor
    );
    jQuery('#sendButtonColor').val(
        (appearance && appearance.sendButtonColor) || D.sendButtonColor
    );
    jQuery('#fontSize').val(
        (appearance && appearance.fontSize) || D.fontSize
    );
    jQuery('#chatInputPlaceholderFontColor').val(
        (appearance && appearance.chatInputPlaceholderFontColor) || D.chatInputPlaceholderFontColor
    );
    jQuery('#chatLinkFontColor').val(
        (appearance && appearance.chatLinkFontColor) || D.chatLinkFontColor
    );
    jQuery('#chatInputFontColor').val(
        (appearance && appearance.chatInputFontColor) || D.chatInputFontColor
    );
    jQuery('#sendButtonFontColor').val(
        (appearance && appearance.sendButtonFontColor) || D.sendButtonFontColor
    );
    jQuery('#sendButtonBorderRadius').val(
        (appearance && appearance.sendButtonBorderRadius != null) ? appearance.sendButtonBorderRadius : D.sendButtonBorderRadius
    );
    jQuery('#sendButtonPadding').val(
        (appearance && appearance.sendButtonPadding != null) ? appearance.sendButtonPadding : D.sendButtonPadding
    );
    jQuery('#chatContainerBorderWidth').val(
        (appearance && appearance.chatContainerBorderWidth != null) ? appearance.chatContainerBorderWidth : D.chatContainerBorderWidth
    );
    jQuery('#chatContainerBorderColor').val(
        (appearance && appearance.chatContainerBorderColor) || D.chatContainerBorderColor
    );
    jQuery('#chatContainerBorderRadius').val(
        (appearance && appearance.chatContainerBorderRadius != null) ? appearance.chatContainerBorderRadius : D.chatContainerBorderRadius
    );
    jQuery('#userMessagePadding').val(
        (appearance && appearance.userMessagePadding != null) ? appearance.userMessagePadding : D.userMessagePadding
    );
    jQuery('#userMessageBorderRadius').val(
        (appearance && appearance.userMessageBorderRadius != null) ? appearance.userMessageBorderRadius : D.userMessageBorderRadius
    );
    jQuery('#userMessageBubbleTail').prop('checked',
        appearance ? !!appearance.userMessageBubbleTail : D.userMessageBubbleTail
    );
    jQuery('#aiMessagePadding').val(
        (appearance && appearance.aiMessagePadding != null) ? appearance.aiMessagePadding : D.aiMessagePadding
    );
    jQuery('#aiMessageBorderRadius').val(
        (appearance && appearance.aiMessageBorderRadius != null) ? appearance.aiMessageBorderRadius : D.aiMessageBorderRadius
    );
    jQuery('#aiMessageBubbleTail').prop('checked',
        appearance ? !!appearance.aiMessageBubbleTail : D.aiMessageBubbleTail
    );

    console.log("Chat look and feel values applied to inputs.");
}

const updateFileList = () => {
    const fileList = document.getElementById('imageFileList');
    const fileInput = document.getElementById('imageFiles');
    fileList.innerHTML = ''; // Clear the current list
    Array.from(fileInput.files).forEach((file, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        fileList.appendChild(listItem);
    });
};

const setupImageUploadListeners = () => {
    const uploadContainer = document.getElementById('imageUploadContainer');
    const fileInput = document.getElementById('imageFiles');
    const browseButton = document.getElementById('imageBrowseButton');
    const fileList = document.getElementById('imageFileList');
    const submitButton = document.getElementById('imageSubmitButton');

    // Handle drag and drop
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.style.backgroundColor = '#e0f7fa';
    });

    uploadContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.style.backgroundColor = '#f9f9f9';
    });

    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadContainer.style.backgroundColor = '#f9f9f9';
        fileInput.files = e.dataTransfer.files; // Update file input with dropped files
        updateFileList(); // Update the file list display
    });

    // Handle browse button click
    browseButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle browse button click
    submitButton.addEventListener('click', () => {
        uploadImage();
    });

    // Handle file selection via browse
    fileInput.addEventListener('change', () => {
        updateFileList(); // Update the file list display
    });
}

const uploadImage = async() => {

  let domain = getLookAndFeelDomain();
  const fileInput = document.getElementById('imageFiles');
  console.log('Doing upload for account: ' + account + ' and domain ' + domain);
  if (fileInput.files.length === 0) {
      alert('Please select a file to upload.');
      return;
  }

    const formData = new FormData();
    Array.from(fileInput.files).forEach(file => {
      console.log('Appending: ' + file.name);
        formData.append('files', file); // Changed to 'files' without brackets
    });

    formData.append('domain', domain);
    formData.append('account', account);
    formData.append('uploadType', 'image');
    console.log('Formdata:', formData)
    try {
        console.log('Sending request with domain:', domain);
        // Submit the form via fetch API
        const response = await fetch(`${serverUrl}/api/processUploads`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();

            alert('Upload successful:');
            hideModal();
            renderChatboxBehavior();
            //alert('Files uploaded successfully!');
        } else {
            console.error('Upload failed:', response.statusText);
            alert('File upload failed. Please try again.');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file. Please try again.');
    }
}

// Intent Category Management Functions
const manageIntentCategories = (domainId, domainName) => {
    console.log(`Managing intent categories for domain ${domainId}: ${domainName}`);
    
    // First get existing categories for this domain
    let postUrl = `${serverUrl}/api/getIntentCategories`;
    jQuery.ajax({
        url: postUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            account: account,
            domainId: domainId
        }),
        success: function(response) {
            showIntentCategoryModal(domainId, domainName, response.categories || []);
        },
        error: function(xhr, status, error) {
            console.error('Error fetching intent categories:', error);
            alert('An error occurred while fetching intent categories.');
        }
    });
}

const showIntentCategoryModal = (domainId, domainName, categories) => {
  const modalHtml = `
    <div class="modal fade" id="intentCategoryModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Manage Intent Categories - ${domainName}</h5>
            <button type="button" class="close" id="intentCategoryModalCloseX">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Add New Category:</label>
              <div class="input-group">
                <input type="text" class="form-control" id="newCategoryInput" placeholder="Enter category name">
                <div class="input-group-append">
                  <button class="btn btn-primary" onclick="addIntentCategory('${domainId}')">Add</button>
                </div>
              </div>
            </div>
            <div id="existingCategories">
              <!-- Categories will be populated here -->
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-danger" onclick="resetIntentCategories('${domainId}')">Reset to Default</button>
            <button type="button" class="btn btn-secondary" id="intentCategoryModalCloseBtn">Close</button>
            <button type="button" class="btn btn-primary" onclick="saveIntentCategories('${domainId}')">Save Changes</button>
          </div>
        </div>
      </div>
    </div>`;
    
  // Remove existing modal if present
  jQuery('#intentCategoryModal').remove();
  jQuery('body').append(modalHtml);
    
  // Populate existing categories
  populateExistingCategories(categories);
    
  // Show modal
  jQuery('#intentCategoryModal').modal('show');

  // Add explicit close handlers for X and Close button
  jQuery('#intentCategoryModalCloseX').on('click', function() {
    jQuery('#intentCategoryModal').modal('hide');
  });
  jQuery('#intentCategoryModalCloseBtn').on('click', function() {
    jQuery('#intentCategoryModal').modal('hide');
  });
}

const populateExistingCategories = (categories) => {
    let categoriesHtml = '<h6>Current Categories:</h6>';
    if (categories.length === 0) {
        categoriesHtml += '<p class="text-muted">No custom categories defined. Default categories will be used.</p>';
    } else {
        categoriesHtml += '<div id="categoryList">';
        categories.forEach((category, index) => {
            categoriesHtml += `
                <div class="input-group mb-2" data-category-index="${index}">
                    <input type="text" class="form-control category-input" value="${category}" />
                    <div class="input-group-append">
                        <button class="btn btn-outline-danger" onclick="removeCategory(${index})">Remove</button>
                    </div>
                </div>`;
        });
        categoriesHtml += '</div>';
    }
    jQuery('#existingCategories').html(categoriesHtml);
}

const addIntentCategory = (domainId) => {
    const newCategory = jQuery('#newCategoryInput').val().trim();
    if (!newCategory) {
        alert('Please enter a category name.');
        return;
    }
    
    // Check for duplicates
    const existingCategories = [];
    jQuery('.category-input').each(function() {
        existingCategories.push(jQuery(this).val().trim().toLowerCase());
    });
    
    if (existingCategories.includes(newCategory.toLowerCase())) {
        alert('This category already exists.');
        return;
    }
    
    // Add to the list
    const newIndex = jQuery('.category-input').length;
    const newCategoryHtml = `
        <div class="input-group mb-2" data-category-index="${newIndex}">
            <input type="text" class="form-control category-input" value="${newCategory}" />
            <div class="input-group-append">
                <button class="btn btn-outline-danger" onclick="removeCategory(${newIndex})">Remove</button>
            </div>
        </div>`;
    
    if (jQuery('#categoryList').length === 0) {
        jQuery('#existingCategories').html('<h6>Current Categories:</h6><div id="categoryList"></div>');
    }
    
    jQuery('#categoryList').append(newCategoryHtml);
    jQuery('#newCategoryInput').val('');
}

const removeCategory = (index) => {
    jQuery(`[data-category-index="${index}"]`).remove();
}

const saveIntentCategories = (domainId) => {
    const categories = [];
    jQuery('.category-input').each(function() {
        const category = jQuery(this).val().trim();
        if (category && !categories.includes(category)) {
            categories.push(category);
        }
    });
    
    let postUrl = `${serverUrl}/api/setIntentCategories`;
    jQuery.ajax({
        url: postUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            account: account,
            domainId: domainId,
            categories: categories
        }),
        success: function(response) {
            console.log('Intent categories updated:', response);
            jQuery('#intentCategoryModal').modal('hide');
            // Refresh the intent list
            renderSelectDomainForAIIntent();
        },
        error: function(xhr, status, error) {
            console.error('Error updating intent categories:', error);
            alert('An error occurred while saving intent categories.');
        }
    });
}

const resetIntentCategories = (domainId) => {
    if (!confirm('This will reset to default intent categories. Are you sure?')) {
        return;
    }
    
    let postUrl = `${serverUrl}/api/resetIntentCategories`;
    jQuery.ajax({
        url: postUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            account: account,
            domainId: domainId
        }),
        success: function(response) {
            console.log('Intent categories reset:', response);
            jQuery('#intentCategoryModal').modal('hide');
            // Refresh the intent list
            renderSelectDomainForAIIntent();
        },
        error: function(xhr, status, error) {
            console.error('Error resetting intent categories:', error);
            alert('An error occurred while resetting intent categories.');
        }
    });
}
