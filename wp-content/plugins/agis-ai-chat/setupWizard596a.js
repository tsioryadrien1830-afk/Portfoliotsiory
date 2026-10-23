// setupWizard.js - First Time Setup Wizard for New Accounts
console.log('Setup Wizard loaded');

// Force setup wizard to show (can be called manually)
const forceSetupWizard = () => {
  console.log('Force setup wizard triggered');
  
  // Clear any existing wizard state
  const account = getCookie('account');
  if (account) {
    localStorage.removeItem(`setupWizardState_${account}`);
  }
  
  // Reset wizard state
  setupWizardState.currentStep = 1;
  setupWizardState.completedSteps = [];
  setupWizardState.wizardData = {};
  setupWizardState.currentDomain = null;
  setupWizardState.isSetupComplete = false;
  
  // Initialize and show the setup wizard
  initializeSetupWizard();
  
  logWizardEvent('setup_wizard_forced', { account: account });
};

// Make functions globally accessible
window.forceSetupWizard = forceSetupWizard;

// Setup wizard state
const setupWizardState = {
  currentStep: 1,
  totalSteps: 7,
  completedSteps: [],
  wizardData: {},
  currentDomain: null,
  isSetupComplete: false,
  regressionQuestions: []
};

// Replace the nav tabs with a single banner when running the setup wizard for new accounts
const setSetupNavBanner = () => {
  try {
    const menu = jQuery('#menuContent');
    if (menu && menu.length) {
      menu.removeClass('collapsed');
      menu.html(`
        <li class="nav-item setup-banner">
          <span class="nav-link active disabled">Domain Setup</span>
        </li>
      `);
    }
  } catch (e) {
    console.warn('Unable to set setup banner in nav:', e);
  }
};

// Check if account needs setup wizard
const checkIfSetupRequired = async () => {
  let accountId = '';

  if (typeof isWordpress !== 'undefined' && isWordpress) {
    accountId =
      typeof ensureWordpressAccountAndCookie === 'function'
        ? await ensureWordpressAccountAndCookie()
        : getCookie('account');
  } else {
    accountId = typeof getValidAccountFromCookie === 'function' ? getValidAccountFromCookie() : getCookie('account');
  }

  if (typeof isValidAccountId === 'function' && !isValidAccountId(accountId)) {
    console.warn('No valid account id; treating setup wizard as required (WordPress new install path).');
    if (typeof isWordpress !== 'undefined' && isWordpress) {
      try {
        jQuery('#tutorialButton').show();
        jQuery('#minimizedChatContainer').show();
      } catch (e) {
        console.warn('Some header elements not found to show:', e);
      }
      setSetupNavBanner();
    }
    return typeof isWordpress !== 'undefined' && isWordpress;
  }

  try {
    // Check if account has any existing domains (primary indicator of setup completion)
    const domains = await getDomainsByAccount();
    console.log('Existing domains for account:', accountId, domains);

    // If no domains exist, account needs setup wizard
    if (!domains || domains.length === 0) {
      console.log('No domains found for account, setup required:', accountId);
      console.log('Deleting local storage');
      localStorage.removeItem(`setupWizardState_${accountId}`);

      try {
        jQuery('#tutorialButton').show();
        jQuery('#minimizedChatContainer').show();
      } catch (e) {
        console.warn('Some header elements not found to show:', e);
      }

      setSetupNavBanner();

      return true;
    }

    console.log('Account has domains, setup not required:', accountId);
    return false;
  } catch (error) {
    console.error('Error checking domains:', error);
    return false;
  }
};

// Make functions globally accessible
window.checkIfSetupRequired = checkIfSetupRequired;

// Initialize setup wizard
const initializeSetupWizard = () => {
  console.log('Initializing setup wizard');
  // First thing: ensure header controls (support button, account dropdown) are bound
  if (typeof initHeaderControls === 'function') {
    try { initHeaderControls(); } catch (e) { console.warn('initHeaderControls failed during early setup init:', e); }
  } else {
    // Fallback: minimal namespaced handlers to guarantee dropdown works during first-time setup
    jQuery('.account-menu').off('.setupFallback').on('click.setupFallback', function(){
      jQuery('.dropdown-menu').toggle();
    });
    jQuery(document).off('.setupFallback').on('click.setupFallback', function(e){
      if (!jQuery(e.target).closest('.account-menu').length) {
        jQuery('.dropdown-menu').hide();
      }
    });
  }
  
  // Load saved state if exists
  loadSetupWizardState();
  
  // Show setup wizard content
  jQuery('#content-area').html(setupWizardHtml);

  // Place setup progress below bottom nav on smaller screens
  const positionSetupProgressForViewport = () => {
    const isSmall = window.matchMedia('(max-width: 1439px)').matches;
    const desktopHost = document.getElementById('setup-progress-desktop-host');
    const mobileHost = document.getElementById('setup-progress-mobile-host');
    const sidebar = document.querySelector('#setup-progress-desktop-host .setup-sidebar, #setup-progress-mobile-host .setup-sidebar');
    if (!desktopHost || !mobileHost || !sidebar) return;

    if (isSmall) {
      if (sidebar.parentElement !== mobileHost) {
        mobileHost.appendChild(sidebar);
      }
    } else {
      if (sidebar.parentElement !== desktopHost) {
        desktopHost.appendChild(sidebar);
      }
    }
  };
  positionSetupProgressForViewport();
  jQuery(window).off('resize.setupProgressPlacement').on('resize.setupProgressPlacement', positionSetupProgressForViewport);
  
  // Load the first step
  loadSetupStep(setupWizardState.currentStep);
  
  // Update progress sidebar
  updateSetupProgress();

  // Ensure header controls (support button, account dropdown) are initialized
  if (typeof initHeaderControls === 'function') {
    try { initHeaderControls(); } catch (e) { console.warn('initHeaderControls failed during setup wizard init:', e); }
  }
};

// Load setup wizard state from localStorage
const loadSetupWizardState = () => {
  const account = getCookie('account');
  const savedState = localStorage.getItem(`setupWizardState_${account}`);

  if (savedState) {
    const state = JSON.parse(savedState);
    setupWizardState.currentStep = state.currentStep || 1;
    setupWizardState.completedSteps = state.completedSteps || [];
    setupWizardState.wizardData = state.wizardData || {};
    setupWizardState.currentDomain = state.currentDomain || null;

    // Clamp step in case the wizard layout changed (e.g. step count reduced)
    if (setupWizardState.currentStep > setupWizardState.totalSteps) {
      setupWizardState.currentStep = setupWizardState.totalSteps;
    }
    setupWizardState.completedSteps = setupWizardState.completedSteps.filter(
      (s) => s >= 1 && s <= setupWizardState.totalSteps
    );
  }
};

// Save setup wizard state to localStorage
const saveSetupWizardState = () => {
  const account = getCookie('account');
  localStorage.setItem(`setupWizardState_${account}`, JSON.stringify(setupWizardState));
};

// Update progress bar and navigation - Works with both top bar and sidebar
const updateSetupProgress = () => {
  const currentStep = setupWizardState.currentStep;
  const totalSteps = setupWizardState.totalSteps;
  
  // Step labels for each step
  const stepLabels = [
    "Define Site to Crawl",
    "Upload Files (Optional)",
    "Configure AI Personality",
    "Customize Appearance",
    "Customize Behavior",
    "Test Your Chatbot",
    "Complete Setup"
  ];
  
  // Calculate progress percentage
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  // === UPDATE TOP NAVIGATION BAR ===
  
  // Update top progress bar text
  // const topProgressText = document.getElementById('setup-progress-text');
  // if (topProgressText) {
  //   const label = stepLabels[currentStep - 1] || "Setup Step";
  //   topProgressText.textContent = `Step ${currentStep} of ${totalSteps}: ${label}`;
  // }
  
  // Update top progress bar fill
  const topProgressBar = document.getElementById('setup-progress-bar');
  if (topProgressBar) {
    topProgressBar.style.width = `${percentage}%`;
    topProgressBar.setAttribute('aria-valuenow', percentage);
  }
  
  // Update top navigation buttons
  const topBackBtn = document.getElementById('setup-back-btn');
  const topNextBtn = document.getElementById('setup-next-btn');
  
  // Back button - disable on first step
  if (topBackBtn) {
    if (currentStep <= 1) {
      topBackBtn.disabled = true;
      topBackBtn.classList.add('disabled');
    } else {
      topBackBtn.disabled = false;
      topBackBtn.classList.remove('disabled');
    }
  }
  
  // Next button text changes on last step
  if (topNextBtn) {
    if (currentStep === totalSteps) {
      topNextBtn.innerHTML = 'Complete<i class="fas fa-check ms-2"></i>';
      topNextBtn.classList.remove('btn-light');
      topNextBtn.classList.add('btn-success');
    } else {
      topNextBtn.innerHTML = 'Next<i class="fas fa-arrow-right ms-2"></i>';
      topNextBtn.classList.remove('btn-success');
      topNextBtn.classList.add('btn-light');
    }
  }
  
  // === UPDATE SIDEBAR PROGRESS ===
  
  // Update sidebar steps
  for (let i = 1; i <= totalSteps; i++) {
    const stepItem = document.getElementById(`step${i}-item`);
    if (stepItem) {
      // Remove all status classes
      stepItem.classList.remove('active', 'completed');
      stepItem.style.background = '';
      stepItem.style.border = '';
      stepItem.style.borderRadius = '';
      stepItem.style.padding = '';
      stepItem.style.marginBottom = '';
      stepItem.style.transition = '';

      const stepNumber = stepItem.querySelector('.step-number');
      const stepTitle = stepItem.querySelector('.step-title');

      if (stepNumber) {
        stepNumber.style.background = '';
        stepNumber.style.color = '';
        stepNumber.style.border = '';
      }
      if (stepTitle) {
        stepTitle.style.color = '';
        stepTitle.style.fontWeight = '';
      }
      
      if (i < currentStep) {
        // Completed steps
        stepItem.classList.add('completed');
        stepItem.style.background = 'rgba(118, 217, 73, 0.18)';
        stepItem.style.border = '1px solid rgba(118, 217, 73, 0.55)';
        stepItem.style.borderRadius = '10px';
        stepItem.style.padding = '8px 10px';
        stepItem.style.marginBottom = '8px';
        stepItem.style.transition = 'all 0.2s ease';

        if (stepNumber) {
          stepNumber.style.background = '#76d949';
          stepNumber.style.color = '#0b1a0f';
          stepNumber.style.border = '1px solid rgba(118, 217, 73, 0.8)';
        }
        if (stepTitle) {
          stepTitle.style.color = '#d7f2c9';
          stepTitle.style.fontWeight = '700';
        }
      } else if (i === currentStep) {
        // Current step
        stepItem.classList.add('active');
        stepItem.style.background = 'rgba(74, 162, 217, 0.16)';
        stepItem.style.border = '1px solid rgba(74, 162, 217, 0.45)';
        stepItem.style.borderRadius = '10px';
        stepItem.style.padding = '8px 10px';
        stepItem.style.marginBottom = '8px';
        stepItem.style.transition = 'all 0.2s ease';

        if (stepNumber) {
          stepNumber.style.background = '#4aa2d9';
          stepNumber.style.color = '#ffffff';
          stepNumber.style.border = '1px solid rgba(74, 162, 217, 0.75)';
        }
        if (stepTitle) {
          stepTitle.style.color = '#eaf4ff';
          stepTitle.style.fontWeight = '700';
        }
      } else {
        // Future steps
        stepItem.style.background = 'rgba(255, 255, 255, 0.03)';
        stepItem.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        stepItem.style.borderRadius = '10px';
        stepItem.style.padding = '8px 10px';
        stepItem.style.marginBottom = '8px';

        if (stepNumber) {
          stepNumber.style.background = 'rgba(255, 255, 255, 0.08)';
          stepNumber.style.color = 'rgba(255, 255, 255, 0.7)';
          stepNumber.style.border = '1px solid rgba(255, 255, 255, 0.15)';
        }
        if (stepTitle) {
          stepTitle.style.color = 'rgba(255, 255, 255, 0.72)';
          stepTitle.style.fontWeight = '500';
        }
      }
      // Future steps remain default (no special class)
    }
  }
  
  // === LEGACY SUPPORT - Update any old progress elements ===
  
  // Update legacy progress label (if exists)
  const progressLabel = document.getElementById('setup-progress-label');
  if (progressLabel) {
    const label = stepLabels[currentStep - 1] || "Setup Step";
    progressLabel.textContent = `Step ${currentStep} of ${totalSteps}: ${label}`;
  }
  
  // Update legacy progress fill (if exists)
  const progressFill = document.getElementById('setup-progress-fill');
  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
    progressFill.setAttribute('aria-valuenow', percentage);
  }
  
  // Update legacy progress percent (if exists)
  const progressPercent = document.getElementById('setup-progress-percent');
  if (progressPercent) {
    progressPercent.textContent = `${percentage}%`;
  }
  
  // Legacy button support (if exists)
  const prevBtn = document.getElementById('setup-prev-btn');
  const nextBtn = document.getElementById('setup-next-btn');
  const completeBtn = document.getElementById('setup-complete-btn');
  
  if (prevBtn && prevBtn !== topBackBtn) {
    if (currentStep <= 1) {
      prevBtn.disabled = true;
      prevBtn.classList.add('disabled');
    } else {
      prevBtn.disabled = false;
      prevBtn.classList.remove('disabled');
    }
  }
  
  if (nextBtn && nextBtn !== topNextBtn && completeBtn) {
    if (currentStep === totalSteps) {
      nextBtn.style.display = 'none';
      completeBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'inline-block';
      completeBtn.style.display = 'none';
    }
  }
  
  console.log(`Setup Progress Updated: Step ${currentStep}/${totalSteps} (${percentage}%)`);
  console.log('Top nav updated, sidebar updated, legacy elements updated');
};

// Load setup step content
const loadSetupStep = (stepNumber) => {
  const contentDiv = document.getElementById('setup-step-content');
  if (!contentDiv) return;
  
  let stepContent = '';
  
  switch (stepNumber) {
    case 1:
      stepContent = getStep1Content(); // Define Site to Crawl
      break;
    case 2:
      stepContent = getStep3Content(); // Upload Files (Optional)
      break;
    case 3:
      stepContent = getStep4Content(); // Configure AI Personality
      break;
    case 4:
      stepContent = getStep5Content(); // Customize Appearance
      break;
    case 5:
      stepContent = getStep6Content(); // Customize Behavior
      break;
    case 6:
      stepContent = getStep7Content(); // Test Your Chatbot
      break;
    case 7:
      stepContent = getStep8Content(); // Complete Setup
      break;
    default:
      stepContent = '<p>Step not found.</p>';
  }
  
  contentDiv.innerHTML = stepContent;
  
  // Initialize step-specific functionality
  initializeStepFunctionality(stepNumber);
};

// Step 1: Define Site to Crawl
const getStep1Content = () => {
  return `
    <h2><i class="fas fa-globe text-primary"></i> Define Site to Crawl</h2>
    <p style="color: var(--agis-text) !important;" class="mb-1">Let's start by setting up your first chatbot. We'll crawl your WordPress website to gather information for your AI assistant.</p>
    <ol class="mb-3">
      <li>We'll crawl your website to gather content</li>
      <li>The content will be processed and indexed</li>
      <li>Your AI will use this content to answer questions</li>
      <li>You can add more content later</li>
    </ol>
    
      <div class="mb-4">
        <label for="setup-account-select" class="form-label">Account</label>
        <select class="form-select" id="setup-account-select">
          <option value="${getCookie('account')}">${getCookie('account')}</option>
        </select>
        <p class="form-text">Choose which account (parent or child) should own this site. Defaults to your current account.</p>
      </div>
        
        <div class="d-flex gap-2 mb-3" id="crawl-input-section">
          <button type="button" class="btn btn-primary" id="start-crawl-btn" onclick="startSiteCrawl()">
            <i class="fas fa-spider text-white me-2"></i>Start Crawling
          </button>
          <div class="fw-bolder">We'll crawl up to 1,000 pages from your website!</div>
        </div>
        
        <div id="crawl-progress" style="display: none;">
          <div class="alert alert-info">
            <div class="mb-3">
              <strong><i class="fas fa-cogs"></i> Discovering pages and crawling the website...</strong>
            </div>

            <div class="mb-2">
              <p id="crawler-status-text" style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">Initializing...</p>
              <div id="crawler-url-feed" class="crawler-url-feed">
                <div id="crawler-current-url" class="crawler-url-row crawler-url-current"></div>
              </div>
            </div>

            <div id="crawl-error" class="alert alert-danger mt-3" style="display: none;"></div>
          </div>
        </div>
        
        <div id="crawl-results" style="display: none;">
          <div class="alert alert-success">
            <i class="fas fa-check-circle"></i> <strong>Crawling completed successfully!</strong><br>
            <span id="crawl-summary"></span>
          </div>
        </div>

        <div id="crawl-warning" style="display: none;">
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i> <strong>Site cannot be crawled</strong><br>
            <span id="crawl-warning-text"></span>
          </div>
        </div>
      </div>
  `;
};

let setupCrawlCurrentUrl = '';
let setupCrawlSeenUrls = new Set();

const resetCrawlFeed = () => {
  setupCrawlCurrentUrl = '';
  setupCrawlSeenUrls = new Set();
};

const setCrawlerCurrentUrlDisplay = (el, url) => {
  if (!el) return;
  el.className = 'crawler-url-row crawler-url-current';
  el.replaceChildren();
  if (url) {
    const textSpan = document.createElement('span');
    textSpan.className = 'crawler-url-text';
    textSpan.textContent = url;
    el.appendChild(textSpan);
  }
};

const pushCrawledUrlToHistory = (url) => {
  const value = String(url || '').trim();
  if (!value || setupCrawlSeenUrls.has(value)) return;
  setupCrawlSeenUrls.add(value);
  const feed = document.getElementById('crawler-url-feed');
  const currentEl = document.getElementById('crawler-current-url');
  if (!feed || !currentEl) return;
  const row = document.createElement('div');
  row.className = 'crawler-url-row crawler-url-row-complete';
  row.innerHTML = '<span class="crawler-url-check" aria-hidden="true"></span><span class="crawler-url-text"></span>';
  row.querySelector('.crawler-url-text').textContent = value;
  feed.insertBefore(row, currentEl);
};

// Step 2: Upload Files (Optional) - using existing upload functionality
const getStep3Content = () => {
  return `
    <h2><i class="fas fa-upload text-primary"></i> Upload Additional Files (Optional)</h2>
    <p style="color: var(--agis-text) !important;" class="mb-2">Add extra documents, PDFs, or text files to enhance your chatbot's knowledge base using our existing upload system.</p>
    <div class="alert alert-info mb-3">
      <h6><i class="fas fa-lightbulb"></i> Pro Tips</h6>
      <ul class="small mb-0">
        <li>Upload product manuals, FAQs, or policies</li>
        <li>Add company information documents</li>
        <li>Include training materials</li>
        <li>Supported: PDF, DOC, DOCX, TXT, CSV</li>
      </ul>
    </div>
    
    <div class="row">
      <div class="col-12">
        <div class="alert alert-info mb-3">
          <strong>Current domain:</strong> <span>${setupWizardState.currentDomain || 'Not set'}</span>
        </div>
        
        <div id="upload-container-wrapper">
          <!-- Upload interface will be injected here using existing upload system -->
        </div>
        
        <div class="mt-3">
          <button type="button" class="btn btn-outline-secondary" onclick="skipFileUpload()">
            Skip <i class="fas fa-arrow-right ms-1"></i>
          </button>
          <div class="form-text mt-2">
            <strong>Skip this step?</strong><br>
            You can continue without uploading files. Your chatbot will work with the crawled website content.
          </div>
        </div>
      </div>
    </div>
  `;
};

// Step 4: Configure AI Personality
const getStep4Content = () => {
  return `
    <h2><i class="fas fa-robot text-primary"></i> Configure AI Personality</h2>
    <p style="color: var(--agis-text) !important;" class="mb-2">Define how your AI assistant should behave and respond to visitors using our existing AI configuration system.</p>
    
    <div class="row">
      <div class="col-12">
        <div class="mb-3">
          <label for="setup-ai-personality" class="form-label">AI Personality & Tone</label>
          <textarea class="form-control mb-2" id="setup-ai-personality" rows="5" placeholder="Example: You are a helpful customer service assistant for XYZ Company. You should be friendly, professional, and knowledgeable about our products and services.">${setupWizardState.wizardData.aiPersonality || ''}</textarea>
          <div class="d-flex gap-2 mb-2">
            <button type="button" class="btn btn-sm btn-outline-primary" onclick="usePersonalityTemplate('professional')">
              Professional Assistant
            </button>
            <button type="button" class="btn btn-sm btn-outline-primary" onclick="usePersonalityTemplate('friendly')">
              Friendly Helper
            </button>
            <button type="button" class="btn btn-sm btn-outline-primary" onclick="usePersonalityTemplate('technical')">
              Technical Expert
            </button>
          </div>
          <div class="form-text mt-0">Describe how your AI should behave and communicate with visitors</div>
          <div class="alert alert-info mt-2 mb-0">
            <strong>Pro Tip:</strong> Your personality setting will integrate with the existing Look & Feel system. You can further customize it later from the main admin interface.
          </div>
        </div>
        
        <div class="mb-3">
          <label for="setup-always-include" class="form-label">(Optional) Frequently asked questions</label>
          <textarea class="form-control" id="setup-always-include" rows="3" placeholder="Example: Q: Do you offer 24/7 support? A: Yes, we provide 24/7 customer support and free shipping on orders over $50.">${setupWizardState.wizardData.alwaysInclude || ''}</textarea>
          <div class="form-text">Add FAQ content that will help the AI answer common questions (optional)</div>
        </div>
        
        <div class="mb-3">
          <label for="setup-languages" class="form-label">Supported Languages</label>
          <input type="text" class="form-control" id="setup-languages" placeholder="English, Spanish, French" value="${setupWizardState.wizardData.languages || 'English'}">
          <div class="form-text">Languages your chatbot should support (comma-separated)</div>
        </div>
        
        <div class="mb-3" style="display: none;">
          <label for="setup-ai-prompt" class="form-label">Custom AI Prompt Template</label>
          <textarea class="form-control" id="setup-ai-prompt" rows="6" placeholder="You are an AI assistant helping users navigate a website.

The user's last inquiry is #usermessage#
Please look at the following results and give your best answer:
-----------------
#results#
-----------------">${setupWizardState.wizardData.aiPrompt || ''}</textarea>
          <div class="form-text">Advanced: Custom prompt template for AI responses (optional)</div>
        </div>
        
        <div class="mb-3">
          <button type="button" class="btn btn-success" id="setup-save-ai-config" onclick="saveAIConfigurationStep()">
            <i class="fas fa-save" style="margin-right: 4px;"></i> Save AI Configuration
          </button>
          <button type="button" class="btn btn-outline-secondary" onclick="setupWizardNextStep()">
            Skip <i class="fas fa-arrow-right ms-1"></i>
          </button>
          <!--<button type="button" class="btn btn-outline-secondary ms-2" onclick="loadExistingAIConfig()">
            <i class="fas fa-sync"></i> Load Existing Config
          </button>-->
        </div>
        
        <div id="ai-config-status" style="display: none;">
          <!-- Status messages will appear here -->
        </div>
      </div>
    </div>
  `;
};

// Step 5: Customize Appearance
const getStep5Content = () => {
  return `
    <h2><i class="fas fa-palette text-primary"></i> Customize Appearance</h2>
    <p style="color: var(--agis-text) !important;" class="mb-4">Customize the visual appearance of your chatbot including colors, fonts, and styling.</p>
    
    <div class="row">
      <div class="col-12">
        <div id="setup-appearance-grid">
        <div class="setup-appearance-group-title">Color options</div>
        
        <div class="mb-3">
          <label for="headerBackgroundColor" class="form-label">Header Background Color</label>
          <input type="color" class="form-control form-control-color" id="headerBackgroundColor" value="#49576b" onchange="updateChatLookAndFeel('headerBackgroundColor', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="headerColor" class="form-label">Header Font Color</label>
          <input type="color" class="form-control form-control-color" id="headerColor" value="#eaf2ff" onchange="updateChatLookAndFeel('headerColor', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="chatBackgroundColor" class="form-label">Chat Background Color</label>
          <input type="color" class="form-control form-control-color" id="chatBackgroundColor" value="#081827" onchange="updateChatLookAndFeel('chatBackgroundColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="chatMessageBackgroundColor" class="form-label">Chat Message Background Color</label>
          <input type="color" class="form-control form-control-color" id="chatMessageBackgroundColor" value="#0f1b2b" onchange="updateChatLookAndFeel('chatMessageBackgroundColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="userFontColor" class="form-label">User Message Font Color</label>
          <input type="color" class="form-control form-control-color" id="userFontColor" value="#eaf2ff" onchange="updateChatLookAndFeel('userFontColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="aiFontColor" class="form-label">AI Message Font Color</label>
          <input type="color" class="form-control form-control-color" id="aiFontColor" value="#eaf2ff" onchange="updateChatLookAndFeel('aiFontColor', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="userTextBackgroundColor" class="form-label">User Message Background</label>
          <input type="color" class="form-control form-control-color" id="userTextBackgroundColor" value="#1a2c42" onchange="updateChatLookAndFeel('userTextBackgroundColor', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="aiTextBackgroundColor" class="form-label">AI Message Background</label>
          <input type="color" class="form-control form-control-color" id="aiTextBackgroundColor" value="#122238" onchange="updateChatLookAndFeel('aiTextBackgroundColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="sendButtonColor" class="form-label">Send Button Color</label>
          <input type="color" class="form-control form-control-color" id="sendButtonColor" value="#4aa2d9" onchange="updateChatLookAndFeel('sendButtonColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="sendButtonFontColor" class="form-label">Send Button Font Color</label>
          <input type="color" class="form-control form-control-color" id="sendButtonFontColor" value="#ffffff" onchange="updateChatLookAndFeel('sendButtonFontColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="chatInputFontColor" class="form-label">Chat Input Font Color</label>
          <input type="color" class="form-control form-control-color" id="chatInputFontColor" value="#eaf2ff" onchange="updateChatLookAndFeel('chatInputFontColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="chatInputPlaceholderFontColor" class="form-label">Chat Input Placeholder Font Color</label>
          <input type="color" class="form-control form-control-color" id="chatInputPlaceholderFontColor" value="#9db0c6" onchange="updateChatLookAndFeel('chatInputPlaceholderFontColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="chatLinkFontColor" class="form-label">Chat Link Font Color</label>
          <input type="color" class="form-control form-control-color" id="chatLinkFontColor" value="#76d949" onchange="updateChatLookAndFeel('chatLinkFontColor', this.value);">
        </div>

        <div class="mb-3">
          <label for="chatContainerBorderColor" class="form-label">Chat Container Border Color</label>
          <input type="color" class="form-control form-control-color" id="chatContainerBorderColor" value="#2a3a4d" onchange="updateChatLookAndFeel('chatContainerBorderColor', this.value);">
        </div>

        <div class="setup-appearance-group-title">Input and layout options</div>

        <div class="mb-3">
          <label for="chatTitle" class="form-label">Chat Window Title</label>
          <input type="text" class="form-control" id="chatTitle" placeholder="Chat With AI" onchange="updateChatLookAndFeel('chatTitle', this.value);">
        </div>

        <div class="mb-3">
          <label for="aiMessagePadding" class="form-label">AI Message Padding (px)</label>
          <input type="number" class="form-control" id="aiMessagePadding" value="8" min="0" max="40" onchange="updateChatLookAndFeel('aiMessagePadding', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="aiMessageBorderRadius" class="form-label">AI Message Border Radius (px)</label>
          <input type="number" class="form-control" id="aiMessageBorderRadius" value="4" min="0" max="50" onchange="updateChatLookAndFeel('aiMessageBorderRadius', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="userMessagePadding" class="form-label">User Message Padding (px)</label>
          <input type="number" class="form-control" id="userMessagePadding" value="8" min="0" max="40" onchange="updateChatLookAndFeel('userMessagePadding', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="userMessageBorderRadius" class="form-label">User Message Border Radius (px)</label>
          <input type="number" class="form-control" id="userMessageBorderRadius" value="4" min="0" max="50" onchange="updateChatLookAndFeel('userMessageBorderRadius', this.value);">
        </div>

        <div class="mb-3">
          <label for="sendButtonBorderRadius" class="form-label">Send Button Border Radius (px)</label>
          <input type="number" class="form-control" id="sendButtonBorderRadius" value="8" min="0" max="999" onchange="updateChatLookAndFeel('sendButtonBorderRadius', this.value);">
        </div>

        <div class="mb-3">
          <label for="sendButtonPadding" class="form-label">Send Button Padding (px)</label>
          <input type="number" class="form-control" id="sendButtonPadding" value="12" min="0" max="50" onchange="updateChatLookAndFeel('sendButtonPadding', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="chatContainerBorderWidth" class="form-label">Chat Container Border Width (px) <small class="text-muted">solid</small></label>
          <input type="number" class="form-control" id="chatContainerBorderWidth" value="0" min="0" max="20" onchange="updateChatLookAndFeel('chatContainerBorderWidth', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="chatContainerBorderRadius" class="form-label">Chat Container Border Radius (px)</label>
          <input type="number" class="form-control" id="chatContainerBorderRadius" value="0" min="0" max="50" onchange="updateChatLookAndFeel('chatContainerBorderRadius', this.value);">
        </div>
        
        <div class="mb-3">
          <label for="fontSize" class="form-label">Font Size (px)</label>
          <input type="number" class="form-control" id="fontSize" value="14" min="10" max="30" onchange="updateChatLookAndFeel('fontSize', this.value);">
        </div>

        <div class="setup-appearance-group-title" style="border-bottom: 1px solid rgba(255,255,255,.15);"></div>
        
        <div class="mb-3 form-check">
          <input type="checkbox" class="form-check-input" id="userMessageBubbleTail" checked onchange="updateChatLookAndFeel('userMessageBubbleTail', this.checked);">
          <label class="form-check-label" for="userMessageBubbleTail">User Message Bubble Tail</label>
        </div>
        
        <div class="mb-3 form-check">
          <input type="checkbox" class="form-check-input" id="aiMessageBubbleTail" checked onchange="updateChatLookAndFeel('aiMessageBubbleTail', this.checked);">
          <label class="form-check-label" for="aiMessageBubbleTail">AI Message Bubble Tail</label>
        </div>

        
        </div>
      </div>
    </div>
    
    <div class="row mt-3">
      <div class="col-md-12">
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-success" id="setup-save-appearance" onclick="saveSetupAppearance()">
            <i class="fas fa-save" style="margin-right: 4px"></i> Save Appearance
          </button>
          <button type="button" class="btn btn-info" id="setup-test-appearance" onclick="testSetupAppearance()">
            <i class="fas fa-eye" style="margin-right: 4px"></i> Preview Chat
          </button>
        </div>
        
        <div id="appearance-status" class="mt-3" style="display: none;">
          <!-- Status messages will appear here -->
        </div>
      </div>
    </div>
  `;
};

// Step 6: Customize Behavior
const getStep6Content = () => {
  return `
    <h2><i class="fas fa-cogs text-primary"></i> Customize Behavior</h2>
    <p style="color: var(--agis-text) !important;">Configure how your chatbot behaves and where it appears on your website.</p>
    
    <div class="row">
      <div class="col-12">
        <div id="setup-behavior-grid">
          <div class="setup-behavior-group-title">Icon options</div>

          <div class="mb-3 setup-behavior-icon-block">
            <label class="form-label">Chat Icon</label>
            <div class="text-center mb-2">
              <img id="minimizedIcon" src="https://jason5-dev.agis.ai/admin/chatIconDefault.png" style="cursor: pointer; max-width: 80px; max-height: 80px; border: 2px solid #ddd; border-radius: 8px;" onclick="showSetupIconUpload();">
            </div>
            <div class="text-center">
              <small class="text-muted">Click image to upload new icon</small>
            </div>
          </div>

          <div class="setup-behavior-group-title">Checkbox options</div>

          <div class="mb-3 form-check">
            <input class="form-check-input" type="checkbox" id="minimizedIconByDefault" checked>
            <label class="form-check-label" for="minimizedIconByDefault">
              Start minimized by default
            </label>
          </div>

          <div class="setup-behavior-group-title">Position and sizing options</div>

          <div class="mb-3">
            <label for="minimizedIconPlacement" class="form-label">Icon Position</label>
            <select class="form-select" id="minimizedIconPlacement" onChange="updateMinimizedChatLookAndFeel(this.id);">
              <option value="BottomRight">Bottom Right</option>
              <option value="BottomLeft">Bottom Left</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label for="minimizedIconWidth" class="form-label">Icon Width (px)</label>
            <input type="number" class="form-control" id="minimizedIconWidth" value="100" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>
          
          <div class="mb-3">
            <label for="minimizedIconHeight" class="form-label">Icon Height (px)</label>
            <input type="number" class="form-control" id="minimizedIconHeight" value="100" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>
          
          <div class="mb-3">
            <label for="minimizedIconRightOffset" class="form-label">Icon Right Offset (px)</label>
            <input type="number" class="form-control" id="minimizedIconRightOffset" value="63" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>
          
          <div class="mb-3">
            <label for="minimizedIconLeftOffset" class="form-label">Icon Left Offset (px)</label>
            <input type="number" class="form-control" id="minimizedIconLeftOffset" value="0" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>
          
          <div class="mb-3">
            <label for="minimizedIconBottomOffset" class="form-label">Icon Bottom Offset (px)</label>
            <input type="number" class="form-control" id="minimizedIconBottomOffset" value="63" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>
          
          <div class="mb-3">
            <label for="chatRightOffset" class="form-label">Chat Right Offset (px)</label>
            <input type="number" class="form-control" id="chatRightOffset" value="15" onChange="updateChatClientLookAndFeel(this.id);">
          </div>
          
          <div class="mb-3">
            <label for="chatBottomOffset" class="form-label">Chat Bottom Offset (px)</label>
            <input type="number" class="form-control" id="chatBottomOffset" value="15" onChange="updateChatClientLookAndFeel(this.id);">
          </div>

          <div class="setup-behavior-group-title">Mobile icon behavior (screens under 768px)</div>

          <div class="mb-3">
            <label for="minimizedIconWidthMobile" class="form-label">Icon Width</label>
            <input type="number" class="form-control" id="minimizedIconWidthMobile" value="60" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>

          <div class="mb-3">
            <label for="minimizedIconHeightMobile" class="form-label">Icon Height</label>
            <input type="number" class="form-control" id="minimizedIconHeightMobile" value="60" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>

          <div class="mb-3">
            <label for="minimizedIconRightOffsetMobile" class="form-label">Icon Right Offset</label>
            <input type="number" class="form-control" id="minimizedIconRightOffsetMobile" value="10" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>

          <div class="mb-3">
            <label for="minimizedIconLeftOffsetMobile" class="form-label">Icon Left Offset</label>
            <input type="number" class="form-control" id="minimizedIconLeftOffsetMobile" value="10" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>

          <div class="mb-3">
            <label for="minimizedIconBottomOffsetMobile" class="form-label">Icon Bottom Offset</label>
            <input type="number" class="form-control" id="minimizedIconBottomOffsetMobile" value="10" onChange="updateMinimizedChatLookAndFeel(this.id);">
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-success" id="setup-save-behavior" onclick="saveSetupBehavior()">
            <i class="fas fa-save" style="margin-right: 4px;"></i> Save Settings
          </button>
<!--          <button type="button" class="btn btn-info" id="setup-test-behavior" onclick="testSetupAppearance()">
            <i class="fas fa-eye" style="margin-right: 4px;"></i> Preview Chat
          </button>
-->        </div>
        
        <div id="behavior-status" class="mt-3" style="display: none;">
          <!-- Status messages will appear here -->
        </div>
      </div>
    </div>
  `;
};

// Step 7: Test Your Chatbot
const getStep7Content = () => {
  return `
    <h2><i class="fas fa-vial text-primary"></i> Test Your Chatbot</h2>
    <p style="color: var(--agis-text) !important;">Create a test suite by adding at least 5 questions to test your chatbot's responses.</p>
    
    <div class="row">
      <div class="col-12">
        <div class="test-chat-container">
          <div class="card mb-4">
            <div class="card-header">
              <h5><i class="fas fa-list-check"></i> Test Questions</h5>
            </div>
            <div class="card-body">
              <p style="color: var(--agis-text) !important;">Add at least 5 questions to test your chatbot. These questions will help you verify that your chatbot is providing good responses.</p>

              <div class="alert alert-info mb-3">
                <h6 class="mb-2"><i class="fas fa-question-circle me-1"></i> Good Test Questions</h6>
                <ul class="small mb-0" id="sample-questions-list">
                  <li>"What services do you offer?"</li>
                  <li>"How can I contact you?"</li>
                  <li>"What are your business hours?"</li>
                  <li>"Tell me about your company"</li>
                  <li>"How much does it cost?"</li>
                  <li>"Do you have any special offers?"</li>
                  <li>"Where are you located?"</li>
                  <li>"How do I get started?"</li>
                </ul>
              </div>
              
              <div id="regression-questions-list" class="mb-3">
                <!-- Questions will be added here -->
              </div>
              
              <div class="input-group mb-3 gap-2">
                <input type="text" class="form-control" id="new-regression-question" placeholder="Enter a test question..." onkeypress="if(event.key==='Enter') addRegressionQuestion()">
                <button type="button" class="btn btn-primary" onclick="addRegressionQuestion()">
                  <i class="fas fa-plus"></i> Add Question
                </button>
              </div>
              
              <div id="regression-test-status" class="alert alert-info">
                <i class="fas fa-info-circle"></i> <span id="question-count-text">0 questions added. Add at least 5 to run the test.</span>
              </div>
              
              <!-- Run Test Button - Hidden until 5 questions added -->
              <div id="run-test-section" style="display: none;">
                <button type="button" class="btn btn-success btn-lg" onclick="runRegressionTest()">
                  <i class="fas fa-play"></i> Run Test
                </button>
                <p class="text-muted mt-2">Review each response and use the "Fix" button to create an override if needed.</p>
              </div>

              <div class="alert alert-info mt-3 mb-0">
                <h6 class="mb-2"><i class="fas fa-chart-line me-1"></i> Test Progress</h6>
                <div id="setup-test-summary">
                  <p class="mb-2">No tests run yet</p>
                </div>
                <small><strong>Not getting good responses?</strong> You can improve your chatbot after setup by adding more content and refining the personality.</small>
              </div>

              <button type="button" class="btn btn-outline-secondary mt-3" onclick="setupWizardNextStep()">
                Skip <i class="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
          </div>

          <!-- Test Progress -->
          <div id="batch-test-progress" style="display: none;">
            <div class="card mb-4">
              <div class="card-body">
                <div class="mb-3">
                  <div class="progress">
                    <div class="progress-bar" id="test-progress-bar" role="progressbar" style="width: 0%"></div>
                  </div>
                  <small id="test-progress-text" class="text-muted">Running tests...</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Test Results -->
          <div id="batch-test-results" style="display: none;">
            <div class="card mb-4">
              <div class="card-header">
                <h5><i class="fas fa-chart-bar"></i> Test Results</h5>
              </div>
              <div class="card-body">
                <div id="test-results-summary" class="alert alert-info mb-3">
                  <!-- Results summary will appear here -->
                </div>
                <div id="test-results-details" class="table-responsive">
                  <!-- Detailed results table will appear here -->
                </div>
              </div>
            </div>
          </div>

          <!-- Test Suggestions -->
          <div id="test-suggestions" style="display: none;">
            <div class="alert alert-info">
              <h6><i class="fas fa-lightbulb"></i> Suggestions to improve responses:</h6>
              <ul class="mb-0">
                <li>Add more specific content to your website</li>
                <li>Upload additional documents with detailed information</li>
                <li>Refine your AI personality description</li>
                <li>Add more pages to crawl</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Step 8: Complete Setup
const getStep8Content = () => {
  return `
    <h2><i class="fas fa-check-circle text-success"></i> Setup Complete!</h2>
    <p style="color: var(--agis-text) !important;">Congratulations! Your chatbot is ready to go live.</p>
    
    <div class="row">
      <div class="col-12">
        <div class="completion-summary">
          <h5>Setup Summary</h5>
          <div class="row">
            <div class="col-md-6">
              <ul class="list-unstyled">
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  <strong>Website:</strong> ${setupWizardState.wizardData.siteUrl || 'Not specified'}
                </li>
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  <strong>Pages Crawled:</strong> ${setupWizardState.wizardData.pagesCrawled || 'N/A'}
                </li>
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  <strong>AI Configured:</strong> ${setupWizardState.wizardData.aiPersonality ? 'Yes' : 'Default'}
                </li>
              </ul>
            </div>
            <div class="col-md-6">
              <ul class="list-unstyled">
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  <strong>Appearance:</strong> Customized
                </li>
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  <strong>Testing:</strong> Completed
                </li>
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  <strong>Status:</strong> Ready to go live
                </li>
              </ul>
            </div>
          </div>

          <div class="alert alert-info mt-3">
            <h6 class="mb-2"><i class="fas fa-rocket me-1"></i> Ready to launch</h6>
            <p class="mb-0">Your chatbot is configured and ready to help your website visitors. You can make it live now or finish setup and continue configuring advanced options.</p>
          </div>

          <div class="row g-2 mt-1">
            <div class="col-12 col-lg-6">
              <button type="button" class="btn btn-success btn-lg w-100" onclick="goLiveChatbot()">
                <i class="fas fa-play me-1"></i> Go Live Now
              </button>
              <small class="text-muted d-block mt-1">Make your chatbot visible to visitors immediately</small>
            </div>
            <div class="col-12 col-lg-6">
              <button type="button" class="btn btn-outline-secondary btn-lg w-100" onclick="finishSetupAndConfigure()">
                <i class="fas fa-cog me-1"></i> Finish and Open Dashboard
              </button>
              <small class="text-muted d-block mt-1">Complete setup and review advanced settings</small>
            </div>
          </div>

          <div class="alert alert-info mt-3 mb-0">
            <h6 class="mb-2"><i class="fas fa-graduation-cap me-1"></i> What to do next</h6>
            <ul class="small mb-3">
              <li>Monitor chatbot conversations in Transcripts</li>
              <li>Add more content and files as needed</li>
              <li>Create tests for quality assurance</li>
              <li>Adjust personality and responses</li>
              <li>Customize advanced appearance settings</li>
            </ul>
            <div>
              <button type="button" class="btn btn-outline-secondary btn-sm" onclick="startSiteTour()">
                <i class="fas fa-route me-1"></i> Take a Full Tour
              </button>
              <small class="text-muted ms-2">Optional guided walk-through of the admin panel</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Populate account selector with parent + child accounts (defaults to current account)
const loadAccountOptionsForWizard = async () => {
  const select = document.getElementById('setup-account-select');
  if (!select) return;
  const current = getCookie('account');

  const applyAccounts = (accounts) => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      accounts = [current];
    }
    const preferred = setupWizardState.wizardData.account || current;
    select.innerHTML = accounts.map(a => `<option value="${a}">${a}</option>`).join('');
    select.value = preferred;
    setupWizardState.wizardData.account = select.value;
    saveSetupWizardState();

    select.onchange = () => {
      setupWizardState.wizardData.account = select.value;
      saveSetupWizardState();
    };
  };

  try {
    const resp = await fetch(`${serverUrl}/api/getAccountFamily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent: current })
    });

    if (!resp.ok) {
      throw new Error(`getAccountFamily HTTP ${resp.status}`);
    }

    let accounts = [];
    try {
      accounts = await resp.json();
    } catch (e) {
      accounts = [];
    }

    if (!Array.isArray(accounts) || accounts.length === 0) {
      accounts = [current];
    }

    applyAccounts(accounts);
  } catch (err) {
    console.warn('getAccountFamily unavailable, falling back to getDomainsByAccountWithOrigin:', err?.message || err);
    try {
      const resp = await fetch(`${serverUrl}/api/getDomainsByAccountWithOrigin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: current })
      });

      let grouped = [];
      try {
        grouped = await resp.json();
      } catch (e) {
        grouped = [];
      }

      const accounts = Array.isArray(grouped)
        ? Array.from(new Set(grouped.map(g => g.account).filter(Boolean)))
        : [];

      applyAccounts(accounts);
    } catch (fallbackErr) {
      console.error('Failed to load account options (all fallbacks):', fallbackErr);
      select.innerHTML = `<option value="${current}">${current}</option>`;
      select.value = current;
    }
  }
};

// Initialize step-specific functionality
const initializeStepFunctionality = (stepNumber) => {
  switch (stepNumber) {
    case 1:
      loadAccountOptionsForWizard();
      break;
    case 2:
      initializeStep3Upload();
      break;
    case 3:
      initializeStep4AIConfig();
      break;
    case 4:
      initializeStep5Appearance();
      break;
    case 5:
      initializeStep6Behavior();
      break;
    case 6:
      initializeStep7Testing();
      break;
  }
};

// Initialize file upload for step 2 using existing upload functionality
const initializeStep3Upload = () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    document.getElementById('upload-container-wrapper').innerHTML = '<div class="alert alert-warning">Please complete step 1 first to set your domain.</div>';
    return;
  }
  
  // Use the existing upload HTML from files.js
  document.getElementById('upload-container-wrapper').innerHTML = uploadFileHtml;
  document.getElementById('upload-header').textContent = 'Upload files for: ' + domain;
  
  // Use existing upload functionality from files.js
  const uploadContainer = document.getElementById('uploadContainer');
  const fileInput = document.getElementById('files');
  const browseButton = document.getElementById('browseButton');
  const fileList = document.getElementById('fileList');
  const submitButton = document.getElementById('submitButton');

  // Function to update the file list display (copied from files.js)
  const updateFileList = () => {
    fileList.innerHTML = '';
    Array.from(fileInput.files).forEach((file, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
      fileList.appendChild(listItem);
    });
  };

  // Handle drag and drop (copied from files.js)
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
    fileInput.files = e.dataTransfer.files;
    updateFileList();
  });

  // Handle browse button click
  browseButton.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle file selection via browse
  fileInput.addEventListener('change', () => {
    updateFileList();
  });

  // Handle form submission (copied and modified from files.js)
  submitButton.addEventListener('click', async() => {
    if (fileInput.files.length === 0) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    Array.from(fileInput.files).forEach(file => {
      console.log('Appending: ' + file.name);
      formData.append('files', file);
    });
    formData.append('domain', domain);
    formData.append('account', getCookie('account'));
    
    try {
      console.log('Sending request with domain:', domain);
      const response = await fetch(`${serverUrl}/api/processUploads`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert('Files uploaded successfully!');
        
        // Log the event
        logWizardEvent('files_uploaded', { 
          domain: domain,
          fileCount: fileInput.files.length
        });
        
        // Enable next step
        document.getElementById('setup-next-btn').disabled = false;
        
        // Clear the form
        fileInput.value = '';
        updateFileList();
      } else {
        console.error('Upload failed:', response.statusText);
        alert('File upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  });
};

const skipFileUpload = () => {
  logWizardEvent('files_upload_skipped', { domain: setupWizardState.currentDomain });
  // Enable next step
  document.getElementById('setup-next-btn').disabled = false;
  alert('File upload skipped. You can always add files later from the Files section.');
  setupWizardNextStep()
};

// Initialize AI configuration for step 4 using existing lookAndFeel system
const initializeStep4AIConfig = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    document.getElementById('ai-config-status').innerHTML = '<div class="alert alert-warning">Please complete step 1 first to set your domain.</div>';
    document.getElementById('ai-config-status').style.display = 'block';
    return;
  }
  
  // Auto-load existing configuration if available
  await loadExistingAIConfig();
  
  logWizardEvent('ai_config_step_initialized', { domain: domain });
};

// Load existing AI configuration using the existing getLookAndFeelData function
const loadExistingAIConfig = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    return;
  }
  
  try {
    // Use the existing getLookAndFeelData function from lookAndFeel.js
    const lookAndFeelData = await getLookAndFeelData(domain);
    
    if (lookAndFeelData) {
      // Load existing personality
      if (lookAndFeelData.personality) {
        document.getElementById('setup-ai-personality').value = lookAndFeelData.personality;
        setupWizardState.wizardData.aiPersonality = lookAndFeelData.personality;
      }
      
      // Load existing always include data
      if (lookAndFeelData.alwaysAvailable) {
        document.getElementById('setup-always-include').value = lookAndFeelData.alwaysAvailable;
        setupWizardState.wizardData.alwaysInclude = lookAndFeelData.alwaysAvailable;
      }
      
      // Load existing languages
      if (lookAndFeelData.languages) {
        document.getElementById('setup-languages').value = lookAndFeelData.languages;
        setupWizardState.wizardData.languages = lookAndFeelData.languages;
      }
      
      // Load existing prompt
      if (lookAndFeelData.prompt) {
        document.getElementById('setup-ai-prompt').value = lookAndFeelData.prompt;
        setupWizardState.wizardData.aiPrompt = lookAndFeelData.prompt;
      }
      
      // Show status
      const statusDiv = document.getElementById('ai-config-status');
      statusDiv.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle"></i> Existing AI configuration loaded successfully.</div>';
      statusDiv.style.display = 'block';
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    } else {
      // No existing config, load defaults
      loadDefaultAIConfig();
    }
    
  } catch (error) {
    console.error('Error loading existing AI config:', error);
    loadDefaultAIConfig();
  }
};

// Load default AI configuration templates
const loadDefaultAIConfig = () => {
  const domain = setupWizardState.currentDomain;
  
  // Set default personality if none exists
  const personalityField = document.getElementById('setup-ai-personality');
  if (!personalityField.value.trim()) {
    personalityField.value = `You are a helpful and professional customer service assistant for ${domain}. You should be friendly, knowledgeable, and helpful when answering questions about our website and services.`;
  }
  
  // Set default languages if none exists
  const languagesField = document.getElementById('setup-languages');
  if (!languagesField.value.trim()) {
    languagesField.value = 'English';
  }
  
  // Set default prompt template if none exists
  const promptField = document.getElementById('setup-ai-prompt');
  if (!promptField.value.trim()) {
    promptField.value = `You are an AI assistant helping users navigate a website.

The user's last inquiry is #usermessage#
Please look at the following results and give your best answer:
-----------------
#results#
-----------------`;
  }
};

// Use personality templates
const usePersonalityTemplate = (templateType) => {
  const domain = setupWizardState.currentDomain || 'your company';
  let template = '';
  
  switch (templateType) {
    case 'professional':
      template = `You are a professional customer service representative for ${domain}. You should be courteous, knowledgeable, and efficient in helping customers with their inquiries. Always maintain a professional tone and provide accurate information.`;
      break;
    case 'friendly':
      template = `You are a friendly and enthusiastic assistant for ${domain}! You love helping customers and making their experience enjoyable. Be warm, helpful, and personable while providing excellent service with a smile.`;
      break;
    case 'technical':
      template = `You are a technical expert and specialist for ${domain}. You provide detailed, accurate, and comprehensive information. Focus on being thorough and precise in your explanations while remaining helpful and accessible.`;
      break;
    default:
      template = `You are a helpful assistant for ${domain}. You should be friendly, professional, and knowledgeable about our services.`;
  }
  
  document.getElementById('setup-ai-personality').value = template;
  
  logWizardEvent('personality_template_used', { templateType, domain: setupWizardState.currentDomain });
};

// Save AI configuration using existing saveLookAndFeel function
const saveAIConfigurationStep = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }
  
  const personality = document.getElementById('setup-ai-personality').value.trim();
  const alwaysInclude = document.getElementById('setup-always-include').value.trim();
  const languages = document.getElementById('setup-languages').value.trim();
  const prompt = document.getElementById('setup-ai-prompt').value.trim();
  
  if (!personality) {
    alert('Please enter an AI personality description.');
    document.getElementById('setup-ai-personality').focus();
    return;
  }
  
  // Show loading state
  const button = document.getElementById('setup-save-ai-config');
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
  
  try {
    // Use existing saveLookAndFeel function from lookAndFeel.js
    await saveLookAndFeel(domain, 'personality', personality);
    
    if (alwaysInclude) {
      await saveLookAndFeel(domain, 'alwaysAvailable', alwaysInclude);
    }
    
    if (languages) {
      await saveLookAndFeel(domain, 'languages', languages);
    }
    
    if (prompt) {
      await saveLookAndFeel(domain, 'prompt', prompt);
    }
    
    // Store in wizard state
    setupWizardState.wizardData.aiPersonality = personality;
    setupWizardState.wizardData.alwaysInclude = alwaysInclude;
    setupWizardState.wizardData.languages = languages;
    setupWizardState.wizardData.aiPrompt = prompt;
    
    saveSetupWizardState();
    
    // Show success message
    const statusDiv = document.getElementById('ai-config-status');
    statusDiv.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> AI configuration saved successfully!
        <br><small>Your chatbot personality and settings have been configured.</small>
      </div>
    `;
    statusDiv.style.display = 'block';
    
    // Enable next step
    document.getElementById('setup-next-btn').disabled = false;
    
    logWizardEvent('ai_config_saved', { 
      domain: domain,
      hasPersonality: !!personality,
      hasAlwaysInclude: !!alwaysInclude,
      hasLanguages: !!languages,
      hasPrompt: !!prompt
    });
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
    
  } catch (error) {
    console.error('Error saving AI configuration:', error);
    
    const statusDiv = document.getElementById('ai-config-status');
    statusDiv.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i> Failed to save AI configuration.
        <br><small>Please try again. Error: ${error.message}</small>
      </div>
    `;
    statusDiv.style.display = 'block';
    
    logWizardEvent('ai_config_save_failed', { 
      domain: domain,
      error: error.message
    });
    
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
};

// Navigation functions
const setupWizardNextStep = async () => {
  // Validate current step
  const isValid = await validateCurrentStep();
  if (!isValid) {
    return;
  }
  
  // Mark current step as completed
  if (!setupWizardState.completedSteps.includes(setupWizardState.currentStep)) {
    setupWizardState.completedSteps.push(setupWizardState.currentStep);
  }
  
  // Save current step data
  saveCurrentStepData();
  
  // Move to next step
  if (setupWizardState.currentStep < setupWizardState.totalSteps) {
    setupWizardState.currentStep++;
    loadSetupStep(setupWizardState.currentStep);
    updateSetupProgress();
    saveSetupWizardState();
  }
};

const setupWizardPreviousStep = () => {
  if (setupWizardState.currentStep > 1) {
    setupWizardState.currentStep--;
    loadSetupStep(setupWizardState.currentStep);
    updateSetupProgress();
    saveSetupWizardState();
  }
};

const setupWizardComplete = () => {
  // Clear setup state
  const account = getCookie('account');
  localStorage.removeItem(`setupWizardState_${account}`);
  
  // Show completion message and redirect
  jQuery('#content-area').html(`
    <div class="text-center p-5">
      <i class="fas fa-check-circle fa-5x text-success mb-4"></i>
      <h2>Setup Complete!</h2>
      <p class="lead">Your chatbot is ready and configured.</p>
      <p>Redirecting to your dashboard...</p>
    </div>
  `);
  
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};

// Go live with the chatbot using existing API
const goLiveChatbot = async () => {
  const domain = setupWizardState.currentDomain;
  const account = getCookie('account');
  
  if (!domain) {
    alert('No domain found. Please restart the setup wizard.');
    return;
  }
  
  // Show loading state
  const button = event?.target || document.querySelector('[onclick*="goLiveChatbot"]');
  let originalText = '';
  
  if (button) {
    originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Going Live...';
  }
  
  try {
    console.log('Setup wizard: Going live with domain:', domain);
    
    // Use existing goLive API (same as accounts.js)
    const postUrl = `${serverUrl}/api/goLive`;
    const payload = { domain };
    
    const response = await new Promise((resolve, reject) => {
      jQuery.ajax({
        url: postUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (data) {
          resolve(data);
        },
        error: function (xhr, status, error) {
          reject(new Error(`Failed to go live: ${error}`));
        }
      });
    });
    
    console.log('Setup wizard: Go live response:', response);
    
    // Clear wizard state - setup is complete since domain now exists
    localStorage.removeItem(`setupWizardState_${account}`);
    
    // Show success message
    jQuery('#content-area').html(`
      <div class="text-center p-4 p-md-5 setup-live-success">
        <i class="fas fa-rocket fa-4x mb-3 setup-live-success-icon"></i>
        <h2 class="setup-live-success-title">Chatbot is Now Live!</h2>
        <p class="lead mb-3">Your chatbot is now active and visible to website visitors.</p>
        <div class="alert alert-success mx-auto setup-live-success-alert" style="max-width: 560px;">
          <h5><i class="fas fa-check-circle me-1"></i> Successfully Launched</h5>
          <p class="mb-0">Domain: <strong>${domain}</strong><br>
          Your chatbot is now responding to visitors on your website.</p>
        </div>
        <p class="text-muted mb-0">Redirecting to your dashboard...</p>
      </div>
    `);
    
    logWizardEvent('chatbot_went_live', { domain: domain });
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('Error going live:', error);
    alert('Error going live: ' + error.message);
    
    if (button) {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }
};

// Finish setup and go to dashboard for more configuration
const finishSetupAndConfigure = () => {
  const domain = setupWizardState.currentDomain;
  
  // Clear wizard state - setup is complete since domain now exists  
  const account = getCookie('account');
  localStorage.removeItem(`setupWizardState_${account}`);
  
  // Show completion message
  jQuery('#content-area').html(`
    <div class="text-center p-5">
      <i class="fas fa-check-circle fa-5x text-primary mb-4"></i>
      <h2>Setup Complete!</h2>
      <p class="lead">Your chatbot is configured and ready. You can now access advanced settings.</p>
      <div class="alert alert-info mx-auto" style="max-width: 500px;">
        <h5><i class="fas fa-info-circle"></i> What's Next?</h5>
        <p class="mb-0">You'll be taken to the main dashboard where you can:
        <br>• Fine-tune your chatbot's responses
        <br>• Add more content and files
        <br>• Monitor conversations
        <br>• Go live when you're ready</p>
      </div>
      <p>Redirecting to your dashboard...</p>
    </div>
  `);
  
  logWizardEvent('setup_completed_configure_more', { domain: domain });
  
  setTimeout(() => {
    window.location.reload();
  }, 2500);
};

// Validation function
const validateCurrentStep = async () => {
  switch (setupWizardState.currentStep) {
    case 1:
      return validateStep1();
    case 3:
      return validateStep4();
    case 6:
      return validateStep7();
    default:
      return true;
  }
};

const validateStep1 = () => {
  // Check if discovery crawl was completed
  if (!setupWizardState.wizardData.domain || !setupWizardState.wizardData.discoveryComplete) {
    alert('Please complete the site discovery crawl before proceeding');
    return false;
  }
  
  return true;
};

const validateStep4 = () => {
  const personality = document.getElementById('setup-ai-personality')?.value?.trim();
  if (!personality) {
    alert('Please enter an AI personality description before proceeding.');
    document.getElementById('setup-ai-personality').focus();
    return false;
  }
  
  // Check if configuration has been saved
  if (!setupWizardState.wizardData.aiPersonality) {
    alert('Please save your AI configuration before proceeding to the next step.');
    return false;
  }
  
  return true;
};

const validateStep7 = () => {
  const questions = setupWizardState.regressionQuestions || [];
  // if (questions.length < 5) {
  //   alert('Please add at least 5 test questions before proceeding.');
  //   return false;
  // }
  return true;
};

// Save current step data
const saveCurrentStepData = async () => {
  switch (setupWizardState.currentStep) {
    case 1:
      if (!setupWizardState.wizardData.siteUrl) {
        setupWizardState.wizardData.siteUrl = getDefaultSetupSiteUrl();
      }
      setupWizardState.wizardData.maxPages = 1000;
      break;
    case 3:
      // AI configuration is saved via the saveAIConfigurationStep function
      // which uses the existing saveLookAndFeel function
      // Data is already stored in setupWizardState.wizardData by that function
      break;
    case 4:
      // Appearance data is saved via the existing saveAppearance function
      // Store basic data in wizard state for summary
      setupWizardState.wizardData.headerBackgroundColor = document.getElementById('headerBackgroundColor')?.value;
      setupWizardState.wizardData.chatTitle = document.getElementById('chatTitle')?.value?.trim();
      setupWizardState.wizardData.userTextBackgroundColor = document.getElementById('userTextBackgroundColor')?.value;
      setupWizardState.wizardData.aiTextBackgroundColor = document.getElementById('aiTextBackgroundColor')?.value;
      break;
    case 5:
      // Behavior data is saved via the existing saveChatBehavior function
      setupWizardState.wizardData.minimizedIconPlacement = document.getElementById('minimizedIconPlacement')?.value;
      setupWizardState.wizardData.minimizedIconByDefault = document.getElementById('minimizedIconByDefault')?.checked;
      break;
    case 6:
      // Test data is already in setupWizardState.regressionQuestions
      break;
  }
};

// Helper function to save look and feel data using existing API
const saveLookAndFeelData = (domain, field, value) => {  
  return new Promise((resolve, reject) => { 
    const postUrl = `${serverUrl}/api/saveLookAndFeelData`;
    console.log('Saving', field, 'for domain', domain, 'with value', value);
    
    jQuery.ajax({
      url: postUrl,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ domain, field, value }),
      success: function(data) {
        resolve(data);
      },
      error: function(xhr, status, error) {
        console.error('Error saving look and feel data:', error);
        reject(error);
      }
    });
  });
};

// File upload functionality for step 2
const initializeFileUpload = () => {
  const uploadArea = document.getElementById('setup-upload-area');
  const fileInput = document.getElementById('setup-file-input');
  const fileList = document.getElementById('file-list');
  const uploadBtn = document.getElementById('upload-files-btn');
  
  // File input change handler
  fileInput.addEventListener('change', (e) => {
    handleFileSelection(e.target.files);
  });
  
  // Drag and drop handlers
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-primary', 'bg-light');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-primary', 'bg-light');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-primary', 'bg-light');
    handleFileSelection(e.dataTransfer.files);
  });
  
  const handleFileSelection = (files) => {
    let fileListHtml = '';
    for (let file of files) {
      fileListHtml += `
        <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
          <div>
            <i class="fas fa-file me-2"></i>
            <span>${file.name}</span>
            <small class="text-muted">(${(file.size / 1024 / 1024).toFixed(2)} MB)</small>
          </div>
          <i class="fas fa-times text-danger" style="cursor: pointer;" onclick="this.parentElement.remove()"></i>
        </div>
      `;
    }
    
    if (fileListHtml) {
      fileList.innerHTML = fileListHtml;
      uploadBtn.style.display = 'inline-block';
    }
  };
};

// Initialize appearance for step 5 using existing systems
const initializeStep5Appearance = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    const statusDiv = document.getElementById('appearance-status');
    statusDiv.innerHTML = '<div class="alert alert-warning">Please complete step 1 first to set your domain.</div>';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Set domain cookie for existing functions
  setCookie('domain', domain, 1);
  
  // Load existing appearance and behavior data
  await loadExistingAppearanceAndBehavior();
  
  logWizardEvent('appearance_behavior_step_initialized', { domain: domain });
};

// Load existing appearance and behavior configuration
const loadExistingAppearanceAndBehavior = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) return;
  
  try {
    // Load existing look and feel data
    const lookAndFeelData = await getLookAndFeelData(domain);
    
    if (lookAndFeelData) {
      // Load appearance data
      if (lookAndFeelData.headerBackgroundColor) {
        document.getElementById('headerBackgroundColor').value = lookAndFeelData.headerBackgroundColor;
      }
      if (lookAndFeelData.headerColor) {
        document.getElementById('headerColor').value = lookAndFeelData.headerColor;
      }
      if (lookAndFeelData.chatTitle) {
        document.getElementById('chatTitle').value = lookAndFeelData.chatTitle;
      }
      if (lookAndFeelData.chatBackgroundColor) {
        document.getElementById('chatBackgroundColor').value = lookAndFeelData.chatBackgroundColor;
      }
      if (lookAndFeelData.chatMessageBackgroundColor) {
        document.getElementById('chatMessageBackgroundColor').value = lookAndFeelData.chatMessageBackgroundColor;
      }
      if (lookAndFeelData.userFontColor) {
        document.getElementById('userFontColor').value = lookAndFeelData.userFontColor;
      }
      if (lookAndFeelData.aiFontColor) {
        document.getElementById('aiFontColor').value = lookAndFeelData.aiFontColor;
      }
      if (lookAndFeelData.userTextBackgroundColor) {
        document.getElementById('userTextBackgroundColor').value = lookAndFeelData.userTextBackgroundColor;
      }
      if (lookAndFeelData.aiTextBackgroundColor) {
        document.getElementById('aiTextBackgroundColor').value = lookAndFeelData.aiTextBackgroundColor;
      }
      if (lookAndFeelData.sendButtonColor) {
        document.getElementById('sendButtonColor').value = lookAndFeelData.sendButtonColor;
      }
      if (lookAndFeelData.sendButtonFontColor) {
        document.getElementById('sendButtonFontColor').value = lookAndFeelData.sendButtonFontColor;
      }
      if (lookAndFeelData.sendButtonBorderRadius !== undefined && lookAndFeelData.sendButtonBorderRadius !== null) {
        document.getElementById('sendButtonBorderRadius').value = lookAndFeelData.sendButtonBorderRadius;
      }
      if (lookAndFeelData.sendButtonPadding !== undefined && lookAndFeelData.sendButtonPadding !== null) {
        document.getElementById('sendButtonPadding').value = lookAndFeelData.sendButtonPadding;
      }
      if (lookAndFeelData.chatInputFontColor) {
        document.getElementById('chatInputFontColor').value = lookAndFeelData.chatInputFontColor;
      }
      if (lookAndFeelData.chatInputPlaceholderFontColor) {
        document.getElementById('chatInputPlaceholderFontColor').value = lookAndFeelData.chatInputPlaceholderFontColor;
      }
      if (lookAndFeelData.chatLinkFontColor) {
        document.getElementById('chatLinkFontColor').value = lookAndFeelData.chatLinkFontColor;
      }
      if (lookAndFeelData.chatContainerBorderWidth !== undefined && lookAndFeelData.chatContainerBorderWidth !== null) {
        document.getElementById('chatContainerBorderWidth').value = lookAndFeelData.chatContainerBorderWidth;
      }
      if (lookAndFeelData.chatContainerBorderColor) {
        document.getElementById('chatContainerBorderColor').value = lookAndFeelData.chatContainerBorderColor;
      }
      if (lookAndFeelData.chatContainerBorderRadius !== undefined && lookAndFeelData.chatContainerBorderRadius !== null) {
        document.getElementById('chatContainerBorderRadius').value = lookAndFeelData.chatContainerBorderRadius;
      }
      if (lookAndFeelData.userMessagePadding !== undefined && lookAndFeelData.userMessagePadding !== null) {
        document.getElementById('userMessagePadding').value = lookAndFeelData.userMessagePadding;
      }
      if (lookAndFeelData.userMessageBorderRadius !== undefined && lookAndFeelData.userMessageBorderRadius !== null) {
        document.getElementById('userMessageBorderRadius').value = lookAndFeelData.userMessageBorderRadius;
      }
      if (lookAndFeelData.userMessageBubbleTail) {
        document.getElementById('userMessageBubbleTail').checked = true;
      }
      if (lookAndFeelData.aiMessagePadding !== undefined && lookAndFeelData.aiMessagePadding !== null) {
        document.getElementById('aiMessagePadding').value = lookAndFeelData.aiMessagePadding;
      }
      if (lookAndFeelData.aiMessageBorderRadius !== undefined && lookAndFeelData.aiMessageBorderRadius !== null) {
        document.getElementById('aiMessageBorderRadius').value = lookAndFeelData.aiMessageBorderRadius;
      }
      if (lookAndFeelData.aiMessageBubbleTail) {
        document.getElementById('aiMessageBubbleTail').checked = true;
      }
      if (lookAndFeelData.fontSize) {
        document.getElementById('fontSize').value = lookAndFeelData.fontSize;
      }
      
      // Load behavior data
      if (lookAndFeelData.behavior) {
        const behavior = lookAndFeelData.behavior;
        
        if (behavior.minimizedIconPlacement) {
          document.getElementById('minimizedIconPlacement').value = behavior.minimizedIconPlacement;
        }
        if (behavior.minimizedIconWidth) {
          document.getElementById('minimizedIconWidth').value = behavior.minimizedIconWidth;
        }
        if (behavior.minimizedIconHeight) {
          document.getElementById('minimizedIconHeight').value = behavior.minimizedIconHeight;
        }
        if (behavior.minimizedIconWidthMobile) {
          document.getElementById('minimizedIconWidthMobile').value = behavior.minimizedIconWidthMobile;
        }
        if (behavior.minimizedIconHeightMobile) {
          document.getElementById('minimizedIconHeightMobile').value = behavior.minimizedIconHeightMobile;
        }
        if (behavior.minimizedIconRightOffset) {
          document.getElementById('minimizedIconRightOffset').value = behavior.minimizedIconRightOffset;
        }
        if (behavior.minimizedIconRightOffsetMobile) {
          document.getElementById('minimizedIconRightOffsetMobile').value = behavior.minimizedIconRightOffsetMobile;
        }
        if (behavior.minimizedIconLeftOffset) {
          document.getElementById('minimizedIconLeftOffset').value = behavior.minimizedIconLeftOffset;
        }
        if (behavior.minimizedIconLeftOffsetMobile) {
          document.getElementById('minimizedIconLeftOffsetMobile').value = behavior.minimizedIconLeftOffsetMobile;
        }
        if (behavior.minimizedIconBottomOffset) {
          document.getElementById('minimizedIconBottomOffset').value = behavior.minimizedIconBottomOffset;
        }
        if (behavior.minimizedIconBottomOffsetMobile) {
          document.getElementById('minimizedIconBottomOffsetMobile').value = behavior.minimizedIconBottomOffsetMobile;
        }
        if (behavior.chatRightOffset) {
          document.getElementById('chatRightOffset').value = behavior.chatRightOffset;
        }
        if (behavior.chatBottomOffset) {
          document.getElementById('chatBottomOffset').value = behavior.chatBottomOffset;
        }
        if (behavior.minimizedIconByDefault !== undefined) {
          document.getElementById('minimizedIconByDefault').checked = behavior.minimizedIconByDefault;
        }
      }
      
      // Load chat icon
      if (lookAndFeelData.chatIcon) {
        const iconUrl = `${window.location.protocol}//${window.location.hostname}`;
        const fullIconUrl = iconUrl + lookAndFeelData.chatIcon;
        document.getElementById('minimizedIcon').src = fullIconUrl;
      }
      
      // Show status
      const statusDiv = document.getElementById('appearance-status');
      statusDiv.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle"></i> Existing appearance and behavior settings loaded.</div>';
      statusDiv.style.display = 'block';
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
    
  } catch (error) {
    console.error('Error loading existing appearance/behavior:', error);
  }
};

// Save appearance using existing saveAppearance function
const saveSetupAppearance = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }
  
  // Set domain cookie for existing function
  setCookie('domain', domain, 1);
  
  const button = document.getElementById('setup-save-appearance');
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
  
  try {
    // Use existing saveAppearance function from lookAndFeel.js
    saveAppearance();
    
    // Show success message
    const statusDiv = document.getElementById('appearance-status');
    statusDiv.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> Appearance settings saved successfully!
      </div>
    `;
    statusDiv.style.display = 'block';
    
    logWizardEvent('appearance_saved', { domain: domain });
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
    
  } catch (error) {
    console.error('Error saving appearance:', error);
    
    const statusDiv = document.getElementById('appearance-status');
    statusDiv.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i> Failed to save appearance settings.
      </div>
    `;
    statusDiv.style.display = 'block';
    
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
};

// Save behavior using existing saveChatBehavior function
const saveSetupBehavior = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }
  
  // Set domain cookie for existing function
  setCookie('domain', domain, 1);
  
  const button = document.getElementById('setup-save-behavior');
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
  
  try {
    // Use existing saveChatBehavior function from lookAndFeel.js
    saveChatBehavior();
    
    // Show success message
    const statusDiv = document.getElementById('appearance-status');
    statusDiv.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> Behavior settings saved successfully!
      </div>
    `;
    statusDiv.style.display = 'block';
    
    logWizardEvent('behavior_saved', { domain: domain });
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
    
  } catch (error) {
    console.error('Error saving behavior:', error);
    
    const statusDiv = document.getElementById('appearance-status');
    statusDiv.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i> Failed to save behavior settings.
      </div>
    `;
    statusDiv.style.display = 'block';
    
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
};

// Test appearance by showing chat
const testSetupAppearance = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }

  try {
    await showChat(domain);
  } catch (error) {
    console.error('Error showing chat preview:', error);
    alert('Failed to show chat preview: ' + error.message);
  }
};

// Show icon upload modal for setup wizard using existing function
const showSetupIconUpload = () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }
  
  // Set domain cookie for existing functions
  setCookie('domain', domain, 1);
  
  // Use the existing showMinimizedIconUpload function from lookAndFeel.js
  showMinimizedIconUpload();
  
  // After the modal closes and upload completes, reload the appearance data
  // This will be handled by the existing renderChatboxBehavior() function in lookAndFeel.js
  // but we need to also update our setup wizard icon
  const originalHideModal = window.hideModal;
  window.hideModal = function() {
    originalHideModal();
    // Reload the setup wizard appearance data after modal closes
    setTimeout(async () => {
      await loadExistingAppearanceAndBehavior();
      // Show success message in setup wizard
      const statusDiv = document.getElementById('appearance-status');
      statusDiv.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i> Chat icon uploaded successfully!
        </div>
      `;
      statusDiv.style.display = 'block';
      
      logWizardEvent('icon_uploaded', { domain: domain });
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }, 500);
    
    // Restore original hideModal function
    window.hideModal = originalHideModal;
  };
};

// Step 1: Start site crawl (discovery-only)
const normalizeWizardUrl = (inputUrl) => {
  if (!inputUrl) return '';
  let raw = String(inputUrl).trim();
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  try {
    const urlObj = new URL(raw);
    const hostname = (urlObj.hostname || '').replace(/^www\./i, '');
    const path = urlObj.pathname || '';
    const search = urlObj.search || '';
    const normalized = `https://${hostname}${path}${search}`;
    return normalized.replace(/\/$/, '');
  } catch (err) {
    return raw.replace(/^https?:\/\//i, 'https:///').replace(/^https:\/\/www\./i, 'https:///').replace(/\/$/, '');
  }
};

const getDefaultSetupSiteUrl = () => {
  const raw = (typeof agisConfig !== 'undefined' && agisConfig.siteUrl)
    ? agisConfig.siteUrl
    : (setupWizardState.wizardData.siteUrl || `${window.location.protocol}//${window.location.hostname}`);
  return normalizeWizardUrl(String(raw || '').trim());
};

const startSiteCrawl = () => {
  const accountSelect = document.getElementById('setup-account-select');
  const siteUrl = getDefaultSetupSiteUrl();
  const selectedAccount = accountSelect?.value || getCookie('account');
  const parentAccount = getCookie('account');
  const maxPages = 1000; // Default crawl size for setup wizard
  
  if (!siteUrl) {
    alert('Unable to determine your website URL.');
    return;
  }

  // Normalize URL format to avoid www/https mismatches
  let cleanUrl = siteUrl;
  
  // Update UI to show progress - add null checks
  const crawlInputSection = document.getElementById('crawl-input-section');
  if (crawlInputSection) {
    crawlInputSection.style.display = 'none';
  }
  
  const crawlProgress = document.getElementById('crawl-progress');
  if (crawlProgress) {
    crawlProgress.style.display = 'block';
  }
  const crawlerStatusText = document.getElementById('crawler-status-text');
  if (crawlerStatusText) {
    crawlerStatusText.textContent = 'Initializing...';
  }
  resetCrawlFeed();
  const crawlerFeed = document.getElementById('crawler-url-feed');
  const crawlerCurrentUrlEl = document.getElementById('crawler-current-url');
  if (crawlerFeed && crawlerCurrentUrlEl) {
    // remove all history rows, keep only the current-url element
    Array.from(crawlerFeed.children).forEach(child => {
      if (child !== crawlerCurrentUrlEl) child.remove();
    });
    crawlerCurrentUrlEl.textContent = '';
    setCrawlerCurrentUrlDisplay(crawlerCurrentUrlEl, '');
  }
  
  // Store domain and account for wizard state
  const domain = cleanUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  setupWizardState.currentDomain = domain;
  setupWizardState.wizardData.domain = domain;
  setupWizardState.wizardData.siteUrl = cleanUrl;
  setupWizardState.wizardData.maxPages = maxPages;
  setupWizardState.wizardData.account = selectedAccount;
  setupWizardState.wizardData.discoveryComplete = false;
  setupWizardState.wizardData.pageCount = 0;
  setupWizardState.wizardData.processingComplete = false;
  setupWizardState.wizardData.processingStarted = false;
  setupWizardState.wizardData.chatbotInitialized = false;
  saveSetupWizardState();
  
  // CLEAR CACHED JOB STATUS to allow re-crawling the same site
  console.log('Setup wizard: Clearing cached job status for', cleanUrl);
  if (window.jobStatuses && window.jobStatuses[cleanUrl]) {
    delete window.jobStatuses[cleanUrl];
    console.log('Setup wizard: Cleared cached job status for', cleanUrl);
  }
  
  // Also clear the domain-based cache key that might be used
  if (window.jobStatuses && window.jobStatuses[domain]) {
    delete window.jobStatuses[domain];
    console.log('Setup wizard: Cleared cached job status for domain', domain);
  }
  
  // Clear any polling intervals that might exist
  if (window.crawlPollingIntervals) {
    Object.keys(window.crawlPollingIntervals).forEach(key => {
      if (key.includes(domain) || key.includes(cleanUrl)) {
        clearInterval(window.crawlPollingIntervals[key]);
        delete window.crawlPollingIntervals[key];
        console.log('Setup wizard: Cleared polling interval for', key);
      }
    });
  }
  
  // Use existing crawlSite function from accounts.js without any overrides
  (async () => {
    try {
      console.log('Setup wizard starting crawl/link for URL:', cleanUrl, 'maxPages:', maxPages);
      const response = await fetch(`${serverUrl}/api/crawlNewSite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: selectedAccount, parentAccount, url: cleanUrl, maxPages: maxPages, mode: 'discovery' })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      console.log('Setup wizard crawl/link response:', data);

      if (data && data.linkedExisting) {
        // Domain already exists and was linked; no need to continue the wizard.
        setCookie('domain', domain, 1);
        logWizardEvent('site_domain_linked_existing', { siteUrl: cleanUrl, domain: domain, parent: data.parent });
        const account = getCookie('account');
        localStorage.removeItem(`setupWizardState_${account}`);
        jQuery('#content-area').html(`
          <div class="text-center p-5">
            <i class="fas fa-link fa-5x text-success mb-4"></i>
            <h2 class="text-success">Domain already exists</h2>
            <p class="lead">We linked your account to <strong>${domain}</strong>.</p>
            <p class="text-muted mb-0">Redirecting you to the dashboard...</p>
          </div>
        `);
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      // Normal crawl path: monitor crawl progress and continue wizard.
      startCrawlMonitoring(cleanUrl);
      logWizardEvent('site_crawl_initiated', { siteUrl: cleanUrl, domain: domain });
    } catch (err) {
      console.error('Setup wizard: failed to start crawl/link:', err);
      alert('Failed to start crawl: ' + (err?.message || err));
    }
  })();
};

// Add missing logWizardEvent function
const logWizardEvent = (event, data) => {
  console.log('Setup Wizard Event:', event, data);
  // Optional: could send to analytics or logging service
};

// Monitor crawl progress and wait for chatbot initialization
const startCrawlMonitoring = (siteUrl) => {
  // Wait a moment for the crawl to start before polling
  setTimeout(() => {
    const progressInterval = setInterval(async () => {
      try {
        console.log('Setup wizard: Checking crawl status for', siteUrl);
        const response = await fetch(`${serverUrl}/api/getCrawlStatus`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: siteUrl
          })
        });
      
        if (response.ok) {
          const status = await response.json();
          console.log('Setup wizard: Crawl status:', status);
        
          updateCrawlStatus(status);

          if (isCrawlBlocked(status)) {
            clearInterval(progressInterval);
            setupWizardState.progressInterval = null;
            if (setupWizardState.timeoutId) {
              clearTimeout(setupWizardState.timeoutId);
              setupWizardState.timeoutId = null;
            }
            showCrawlBlocked(status, siteUrl);
            return;
          }
        
          const immediateBlockText = (status?.crawlerDetails?.status || status?.crawlerStatus || status?.status || '').toLowerCase();
          if (immediateBlockText.includes('blocked')) {
            clearInterval(progressInterval);
            setupWizardState.progressInterval = null;
            if (setupWizardState.timeoutId) {
              clearTimeout(setupWizardState.timeoutId);
              setupWizardState.timeoutId = null;
            }
            showCrawlBlocked(status, siteUrl);
            return;
          }

          const discoveryComplete = status.crawlerProgress >= 1 || status.crawlingComplete;

          if (discoveryComplete) {
            clearInterval(progressInterval);
            setupWizardState.progressInterval = null; // Mark as completed
            if (setupWizardState.timeoutId) {
              clearTimeout(setupWizardState.timeoutId); // Clear timeout
              setupWizardState.timeoutId = null;
            }
            showCrawlDiscoveryComplete(status, siteUrl);
          }
        } else {
          console.warn('Setup wizard: Failed to get crawl status');
        }
      } catch (error) {
        console.error('Setup wizard: Error checking crawl status:', error);
        // Continue monitoring even if one request fails
      }
    }, 3000); // Check every 3 seconds
  
    // Store interval reference for cleanup
    setupWizardState.progressInterval = progressInterval;
  
    // No timeout: keep polling until completion; rely on server status to stop.
    setupWizardState.timeoutId = null;
  }, 2000); // Wait 2 seconds before starting to poll
};

// Kick off backend extraction & vectorization once discovery is complete.
// Runs in the background while the user proceeds through the rest of the wizard.
const startSiteProcessing = async () => {
  const domain = setupWizardState.currentDomain;
  const siteUrl = setupWizardState.wizardData.siteUrl;
  const account = setupWizardState.wizardData.account || getCookie('account');
  const parentAccount = getCookie('account');
  if (!domain || !siteUrl) return;

  if (setupWizardState.wizardData.processingStarted || setupWizardState.wizardData.processingComplete) {
    return;
  }

  setupWizardState.wizardData.processingComplete = false;
  setupWizardState.wizardData.processingStarted = true;
  saveSetupWizardState();

  try {
    await fetch(`${serverUrl}/api/continueCrawlProcessing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: siteUrl, account, parentAccount })
    });
  } catch (error) {
    console.error('Failed to start processing:', error);
  }

  startProcessingMonitoring(siteUrl);
};

const startProcessingMonitoring = (siteUrl) => {
  setTimeout(() => {
    const progressInterval = setInterval(async () => {
      try {
        const response = await fetch(`${serverUrl}/api/getCrawlStatus`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: siteUrl })
        });

        if (response.ok) {
          const status = await response.json();
          updateProcessingStatus(status);

          const hasAccountProgress = typeof status.accountProgress === 'number';
          const processingComplete = status.done ||
            (status.extracterProgress >= 1 && status.vectorizerProgress >= 1 && (!hasAccountProgress || status.accountProgress >= 1));
          if (processingComplete) {
            clearInterval(progressInterval);
            showProcessingComplete(status);
          }
        }
      } catch (error) {
        console.error('Setup wizard: Error checking processing status:', error);
      }
    }, 3000);
  }, 2000);
};

const updateProcessingStatus = (status) => {
  const extracterPercent = Math.round((status.extracterProgress || 0) * 100);
  const vectorizerPercent = Math.round((status.vectorizerProgress || 0) * 100);

  if (!setupWizardState.wizardData.processingComplete && extracterPercent >= 100 && vectorizerPercent >= 100) {
    showProcessingComplete(status);
  }
};

const showProcessingComplete = (status) => {
  setupWizardState.wizardData.processingComplete = true;
  setupWizardState.wizardData.processingStarted = false;
  setupWizardState.wizardData.chatbotInitialized = true;
  setupWizardState.wizardData.pagesCrawled = status.pageCount || setupWizardState.wizardData.pageCount;
  setupWizardState.wizardData.discoveryComplete = true;
  if (!setupWizardState.wizardData.pageCount) {
    setupWizardState.wizardData.pageCount = 0;
  }
  saveSetupWizardState();

  logWizardEvent('site_processing_complete', {
    domain: setupWizardState.currentDomain,
    pageCount: setupWizardState.wizardData.pagesCrawled
  });
};

const updateCrawlStatus = (status) => {
  console.log('Setup wizard crawl status update:', {
    crawler: status.crawlerProgress,
    extracter: status.extracterProgress,
    vectorizer: status.vectorizerProgress,
    account: status.accountProgress,
    done: status.done
  });
  
  // Get progress values (0 to 1)
  const crawlerProg = status.crawlerProgress || 0;
  const extracterProg = status.extracterProgress || 0;
  const vectorizerProg = status.vectorizerProgress || 0;
  
  // Convert to percentages
  const crawlerPercent = Math.round(crawlerProg * 100);
  const extracterPercent = Math.round(extracterProg * 100);
  const vectorizerPercent = Math.round(vectorizerProg * 100);

  // Show live crawler status text and current page URL.
  // The backend embeds the URL inside crawlerStatus, e.g. "Crawling https://example.com/page"
  const crawlerStatusText = document.getElementById('crawler-status-text');
  const crawlerCurrentUrlEl = document.getElementById('crawler-current-url');
  const crawlerStatusRaw = String(status.crawlerStatus || '').trim();

  // Extract URL from status string or use dedicated field if the backend eventually provides it
  const urlMatch = crawlerStatusRaw.match(/https?:\/\/\S+/i);
  const extractedUrl = (status.currentCrawlUrl || (urlMatch ? urlMatch[0] : '')).trim();
  const statusLabel = extractedUrl
    ? crawlerStatusRaw.replace(/https?:\/\/\S+/gi, '').replace(/\s{2,}/g, ' ').trim()
    : (crawlerStatusRaw || (crawlerPercent > 0 ? `In progress (${crawlerPercent}%)` : 'Initializing...'));

  if (crawlerStatusText) {
    crawlerStatusText.textContent = statusLabel || 'Crawling...';
  }

  if (crawlerCurrentUrlEl) {
    const currentUrl = extractedUrl;
    if (currentUrl && currentUrl !== setupCrawlCurrentUrl) {
      if (setupCrawlCurrentUrl) {
        pushCrawledUrlToHistory(setupCrawlCurrentUrl);
      }
      setupCrawlCurrentUrl = currentUrl;
      setCrawlerCurrentUrlDisplay(crawlerCurrentUrlEl, currentUrl);
    } else if (!currentUrl && setupCrawlCurrentUrl) {
      pushCrawledUrlToHistory(setupCrawlCurrentUrl);
      setupCrawlCurrentUrl = '';
      setCrawlerCurrentUrlDisplay(crawlerCurrentUrlEl, '');
    }
  }
  
  // Update Extractor Progress Bar
  const extracterBar = document.getElementById('extracter-progress-bar');
  const extracterBadge = document.getElementById('extracter-percent');
  const extracterStatusText = document.getElementById('extracter-status-text');
  if (extracterBar) {
    extracterBar.style.width = `${extracterPercent}%`;
    extracterBar.setAttribute('aria-valuenow', extracterPercent);
    if (extracterPercent >= 100) {
      extracterBar.classList.remove('progress-bar-animated');
    }
  }
  if (extracterBadge) {
    extracterBadge.textContent = `${extracterPercent}%`;
  }
  if (extracterStatusText) {
    extracterStatusText.textContent = status.extracterStatus || 'In progress...';
  }
  
  // Update Vectorizer Progress Bar
  const vectorizerBar = document.getElementById('vectorizer-progress-bar');
  const vectorizerBadge = document.getElementById('vectorizer-percent');
  const vectorizerStatusText = document.getElementById('vectorizer-status-text');
  if (vectorizerBar) {
    vectorizerBar.style.width = `${vectorizerPercent}%`;
    vectorizerBar.setAttribute('aria-valuenow', vectorizerPercent);
    if (vectorizerPercent >= 100) {
      vectorizerBar.classList.remove('progress-bar-animated');
    }
  }
  if (vectorizerBadge) {
    vectorizerBadge.textContent = `${vectorizerPercent}%`;
  }
  if (vectorizerStatusText) {
    vectorizerStatusText.textContent = status.vectorizerStatus || 'In progress...';
  }

  const crawlError = document.getElementById('crawl-error');
  if (crawlError) {
    if (status.error) {
      const detailLines = Array.isArray(status.errorDetails) ? status.errorDetails.join('<br>') : '';
      crawlError.innerHTML = `
        <strong>Something went wrong during crawling.</strong><br>
        <span>${status.error}</span>
        ${detailLines ? `<div class="mt-2 small">${detailLines}</div>` : ''}
        <div class="mt-2 small">Please share this message with support.</div>
      `;
      crawlError.style.display = 'block';
    } else {
      crawlError.style.display = 'none';
      crawlError.innerHTML = '';
    }
  }
  
  console.log('Setup wizard: Updated all progress bars');
};

const isCrawlBlocked = (status) => {
  if (!status) return false;
  if (status.crawlerBlocked || status.blocked) return true;
  if (status.crawlerDetails?.blocked) return true;
  const errorText = (status.error || status.crawlerError || '').toLowerCase();
  const statusText = (status.crawlerStatus || '').toLowerCase();
  const detailStatusText = (status.crawlerDetails?.status || '').toLowerCase();
  const detailErrorText = (status.crawlerDetails?.error || '').toLowerCase();
  const detailReasonText = (status.crawlerDetails?.blockReason || '').toLowerCase();
  const topLevelStatusText = (status.status || '').toLowerCase();
  const topLevelReasonText = (status.blockReason || '').toLowerCase();
  const blockKeywords = [
    'cloudflare',
    'captcha',
    'verify you are human',
    'access denied',
    'blocked',
    'security check',
    'unusual traffic',
    'enable javascript',
    'enable cookies'
  ];
  const hasError = blockKeywords.some((keyword) => errorText.includes(keyword));
  const hasStatus = blockKeywords.some((keyword) => statusText.includes(keyword));
  const hasDetailStatus = blockKeywords.some((keyword) => detailStatusText.includes(keyword));
  const hasDetailError = blockKeywords.some((keyword) => detailErrorText.includes(keyword));
  const hasDetailReason = blockKeywords.some((keyword) => detailReasonText.includes(keyword));
  const hasTopLevelStatus = blockKeywords.some((keyword) => topLevelStatusText.includes(keyword));
  const hasTopLevelReason = blockKeywords.some((keyword) => topLevelReasonText.includes(keyword));
  return hasError || hasStatus || hasDetailStatus || hasDetailError || hasDetailReason || hasTopLevelStatus || hasTopLevelReason;
};

const showCrawlBlocked = (status, siteUrl) => {
  const crawlProgress = document.getElementById('crawl-progress');
  if (crawlProgress) {
    crawlProgress.style.display = 'none';
  }

  const crawlResults = document.getElementById('crawl-results');
  if (crawlResults) {
    crawlResults.style.display = 'none';
  }

  const warningElement = document.getElementById('crawl-warning');
  if (warningElement) {
    warningElement.style.display = 'block';
  }

  const warningText = document.getElementById('crawl-warning-text');
  if (warningText) {
    const message = status?.error || status?.crawlerError || 'This site appears to be protected against automated crawling.';
    warningText.textContent = message;
  }

  const nextBtn = document.getElementById('setup-next-btn');
  if (nextBtn) {
    nextBtn.disabled = false;
  }

  setupWizardState.wizardData.pageCount = status?.pageCount || 0;
  setupWizardState.wizardData.discoveryComplete = false;
  saveSetupWizardState();

  logWizardEvent('crawl_blocked', {
    domain: setupWizardState.currentDomain,
    siteUrl: siteUrl,
    reason: status?.crawlerBlockReason || status?.error || 'blocked'
  });
};

const showCrawlDiscoveryComplete = (status, siteUrl) => {
  console.log('Setup wizard: Discovery complete');
  if (isCrawlBlocked(status)) {
    showCrawlBlocked(status, siteUrl);
    return;
  }
  
  // Clear any timeout that might still be pending
  setupWizardState.progressInterval = null;
  if (setupWizardState.timeoutId) {
    clearTimeout(setupWizardState.timeoutId);
    setupWizardState.timeoutId = null;
  }
  
  const crawlProgress = document.getElementById('crawl-progress');
  if (crawlProgress) {
    crawlProgress.style.display = 'none';
  }
  
  const crawlResults = document.getElementById('crawl-results');
  if (crawlResults) {
    crawlResults.style.display = 'block';
  }
  
  const summaryElement = document.getElementById('crawl-summary');
  if (summaryElement) {
    const pageCount = status.pageCount || (status.pages ? status.pages.length : 'several');

    summaryElement.innerHTML = `
      <p>
        Successfully discovered ${pageCount} pages. We'll keep processing the content in the background while you continue.
      </p>
      <p style="font-weight: 500;" class="mb-0">
        Next step: upload any additional files (optional).
      </p>
    `;
  }
  
  // Enable next step now that everything is complete
  const nextBtn = document.getElementById('setup-next-btn');
  if (nextBtn) {
    nextBtn.disabled = false;
  }
  
  setupWizardState.wizardData.pageCount = status.pageCount || (status.pages ? status.pages.length : 0);
  setupWizardState.wizardData.discoveryComplete = true;
  saveSetupWizardState();

  // Kick off extraction + vectorization in the background.
  startSiteProcessing();

  logWizardEvent('discovery_complete', {
    domain: setupWizardState.currentDomain,
    pageCount: status.pageCount,
    siteUrl: siteUrl,
    crawlerProgress: status.crawlerProgress,
    extracterProgress: status.extracterProgress,
    vectorizerProgress: status.vectorizerProgress,
    accountProgress: status.accountProgress
  });
};

const showCrawlTimeout = () => {
  const statusElement = document.getElementById('crawl-status');
  if (statusElement) {
    statusElement.textContent = 'Crawling is taking longer than expected...';
  }

  const crawlResults = document.getElementById('crawl-results');
  if (crawlResults) {
    crawlResults.innerHTML = `
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle"></i> <strong>Still Processing</strong>
        <br>Your site is still being processed. You can continue with the setup, but testing may not work until processing completes.
        <br><small class="text-muted">Check the main interface for detailed progress updates.</small>
      </div>
    `;
    crawlResults.style.display = 'block';
  }

  // Allow proceeding even if crawl isn't complete yet - add null checks
  const nextBtn = document.getElementById('setup-next-btn');
  if (nextBtn) {
    nextBtn.disabled = false;
  }
  
  const crawlProgress = document.getElementById('crawl-progress');
  if (crawlProgress) {
    crawlProgress.style.display = 'none';
  }
};

// Setup Wizard Testing Functions
let currentTestQuestion = '';
let currentTestResponse = '';
let setupWizardTestName = 'Setup_Wizard_Test';

// Test chatbot with a question using existing talk API
const testChatbot = async () => {
  const question = document.getElementById('setup-test-question').value.trim();
  if (!question) {
    alert('Please enter a test question.');
    return;
  }
  
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }
  
  // Show loading state
  const button = document.getElementById('test-chatbot-btn');
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testing...';
  
  try {
    // Store current test data
    currentTestQuestion = question;
    
    // Use existing talk API (same as chat.js)
    const response = await fetch(`${serverUrl}/api/talk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: domain,
        text: question,
        user: 'setupWizard',
        testing: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    currentTestResponse = data.message || 'No response received';
    
    // Display the response
    const responseContainer = document.getElementById('test-response-container');
    const responseDiv = document.getElementById('test-response');
    
    responseDiv.innerHTML = currentTestResponse;
    responseContainer.style.display = 'block';
    
    // Scroll to response
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    logWizardEvent('single_test_completed', { 
      domain: domain,
      question: question,
      response: currentTestResponse.substring(0, 100) + '...'
    });
    
  } catch (error) {
    console.error('Error testing chatbot:', error);
    alert('Error testing chatbot: ' + error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
};

// Mark test response as good
const markSetupTestGood = () => {
  if (!currentTestQuestion || !currentTestResponse) {
    alert('No test response to mark.');
    return;
  }
  
  // Show success feedback
  const responseContainer = document.getElementById('test-response-container');
  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success mt-2';
  successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Great! This response is marked as good.';
  
  // Remove any existing feedback
  const existingFeedback = responseContainer.querySelector('.alert');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  responseContainer.appendChild(successDiv);
  
  logWizardEvent('test_marked_good', { 
    domain: setupWizardState.currentDomain,
    question: currentTestQuestion
  });
  
  // Update test summary
  updateSetupTestSummary('good');
};

// Mark test response as needs work - create override using existing system
const markSetupTestNeedsWork = () => {
  if (!currentTestQuestion || !currentTestResponse) {
    alert('No test response to mark.');
    return;
  }
  
  // Create override data matching the expected format from transcripts.js
  const overrideData = {
    domain: setupWizardState.currentDomain,
    reformedMessage: currentTestQuestion,
    agentMessage: currentTestResponse
  };
  
  // Use existing override modal from transcripts.js
  if (typeof showOverrideResponseModal === 'function') {
    // Set domain cookie so the existing saveOverrideResponse function works correctly
    setCookie('domain', setupWizardState.currentDomain, 1);
    
    showOverrideResponseModal(overrideData);
    
    // The existing saveOverrideResponse function will work correctly now since we set the domain cookie
    // No need to override it - just let the modal use the existing function
    
  } else {
    // Fallback: create our own simple override modal
    createSetupOverrideModal();
  }
  
  logWizardEvent('test_marked_needs_work', { 
    domain: setupWizardState.currentDomain,
    question: currentTestQuestion
  });
  
  // Update test summary
  updateSetupTestSummary('needs_work');
};

// Create override modal for setup wizard
const createSetupOverrideModal = () => {
  const modalHtml = `
    <div class="modal fade" id="setupOverrideModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create Override Response</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Question:</label>
              <div class="form-control-plaintext bg-light p-2 rounded">${currentTestQuestion}</div>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Current AI Response:</label>
              <div class="form-control-plaintext bg-light p-2 rounded" style="max-height: 200px; overflow-y: auto;">${currentTestResponse}</div>
            </div>
            
            <div class="mb-3">
              <label for="overrideResponse" class="form-label">Better Response: <span class="text-danger">*</span></label>
              <textarea class="form-control" id="overrideResponse" rows="6" placeholder="Enter the response you want the chatbot to give for this question..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveSetupOverride()">Save Override</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('setupOverrideModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('setupOverrideModal'));
  modal.show();
};

// Save override response using correct API
const saveSetupOverride = async () => {
  const overrideText = document.getElementById('overrideResponse').value.trim();
  
  if (!overrideText) {
    alert('Please enter an override response.');
    return;
  }
  
  const domain = setupWizardState.currentDomain;
  const account = getCookie('account');
  
  if (!domain || !account) {
    alert('Missing domain or account information.');
    return;
  }
  
  try {
    // Use the same structure as the working transcripts.js saveOverrideResponse
    const requestBody = {
      account: account,
      domain: domain,
      originalQuestion: currentTestQuestion,
      desiredResponse: overrideText
    };
    
    console.log('Saving override response for setup wizard:', requestBody);
    
    const response = await fetch(`${serverUrl}/api/saveOverrideResponse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Override response saved successfully:', responseData);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('setupOverrideModal'));
    if (modal) {
      modal.hide();
    }
    
    // Show success message
    const successDiv = document.getElementById('override-success');
    if (successDiv) {
      successDiv.style.display = 'block';
      setTimeout(() => {
        successDiv.style.display = 'none';
      }, 3000);
    }
    
    // Refresh override list
    setTimeout(() => {
      loadSetupOverrides();
    }, 1000); // Small delay to allow the backend to process
    
    logWizardEvent('override_created', { 
      domain: domain,
      question: currentTestQuestion
    });
    
    alert('Override Response Saved Successfully!');
    
  } catch (error) {
    console.error('Error saving override:', error);
    alert('Error saving override: ' + error.message);
  }
};

// Load and display created overrides using existing API (same as main dashboard)
const loadSetupOverrides = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) return;
  
  try {
    const account = getCookie('account');
    
    // Use the same schemaName format as the main dashboard
    const schemaName = capitalize(account) + '_' + domain.replace(/\./g,'_') + '_Overrides';
    
    // Use existing getVectorDBData API (same as main dashboard)
    const response = await fetch(`${serverUrl}/api/getVectorDBData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: account,
        schemaName: schemaName
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const overrides = await response.json();
    const container = document.getElementById('setup-overrides-container');
    
    if (!overrides || overrides.length === 0) {
      container.innerHTML = `
        <div class="text-muted text-center py-3">
          <i class="fas fa-info-circle"></i> No overrides created yet. Test questions above and mark responses that need work to create overrides.
        </div>
      `;
      return;
    }
    
    let overridesHtml = '<div class="table-responsive"><table class="table table-hover">';
    overridesHtml += '<thead><tr><th>Question/Search</th><th>Override Response</th><th>Created</th></tr></thead><tbody>';
    
    overrides.forEach(override => {
      // Parse the contents to extract question and answer
      const contents = override.contents || '';
      const questionMatch = contents.match(/Question:\s*(.*?)\n/s);
      const answerMatch = contents.match(/Answer:\s*(.*?)$/s);
      
      const question = questionMatch ? questionMatch[1].trim() : 'N/A';
      const response = answerMatch ? answerMatch[1].trim() : 'N/A';
      const created = override._creationTimeUnix ? 
        new Date(override._creationTimeUnix).toLocaleDateString() : 
        (override.createdAt ? new Date(override.createdAt).toLocaleDateString() : 'Unknown');
      
      overridesHtml += `
        <tr>
          <td style="max-width: 200px;">
            <div class="text-truncate" title="${question}">${question}</div>
          </td>
          <td style="max-width: 300px;">
            <div class="text-truncate" title="${response}">${response}</div>
          </td>
          <td>
            <small class="text-muted">${created}</small>
          </td>
        </tr>
      `;
    });
    
    overridesHtml += '</tbody></table></div>';
    container.innerHTML = overridesHtml;
    
    logWizardEvent('overrides_loaded', { 
      domain: domain,
      count: overrides.length
    });
    
  } catch (error) {
    console.error('Error loading overrides:', error);
    const container = document.getElementById('setup-overrides-container');
    container.innerHTML = `
      <div class="text-warning text-center py-3">
        <i class="fas fa-exclamation-triangle"></i> Error loading overrides. Please refresh and try again.
        <br><small>Error: ${error.message}</small>
      </div>
    `;
  }
};

// Update test summary - supports both individual and batch test results
const updateSetupTestSummary = (result) => {
  const summaryDiv = document.getElementById('setup-test-summary');
  
  if (!window.setupTestResults) {
    window.setupTestResults = { good: 0, needs_work: 0, batch_good: 0, batch_needs_work: 0 };
  }
  
  if (result) {
    window.setupTestResults[result]++;
  }
  
  // Calculate totals including batch results
  const individualGood = window.setupTestResults.good || 0;
  const individualNeedsWork = window.setupTestResults.needs_work || 0;
  const batchGood = window.setupTestResults.batch_good || 0;
  const batchNeedsWork = window.setupTestResults.batch_needs_work || 0;
  
  const totalGood = individualGood + batchGood;
  const totalNeedsWork = individualNeedsWork + batchNeedsWork;
  const total = totalGood + totalNeedsWork;
  
  summaryDiv.innerHTML = `
    <div class="mb-2">
      <strong>Tests Run:</strong> ${total}
      ${total > 0 ? `<small class="text-muted">(${individualGood + individualNeedsWork} individual, ${batchGood + batchNeedsWork} batch)</small>` : ''}
    </div>
    <div class="mb-2">
      <span class="badge bg-success me-1">${totalGood} Good</span>
      <span class="badge bg-warning">${totalNeedsWork} Need Work</span>
    </div>
    <div class="progress">
      <div class="progress-bar bg-success" style="width: ${total > 0 ? (totalGood / total * 100) : 0}%"></div>
    </div>
  `;
};

// Batch testing - run prebuilt tests
const runPrebuiltTests = async (event) => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }
  
  // Ensure we have a test structure in place
  await ensureSetupTestExists();
  
  // Prebuilt test questions for common business scenarios
  const prebuiltQuestions = [
    "What services do you offer?",
    "How can I contact you?", 
    "What are your business hours?",
    "Tell me about your company",
    "How much does it cost?",
    "Where are you located?",
    "How do I get started?",
    "What is your return policy?",
    "Do you provide support?",
    "What are your payment options?"
  ];
  
  // Get button element - handle both event target and direct element lookup
  const button = event?.target || document.querySelector('[onclick*="runPrebuiltTests"]');
  let originalText = '';
  
  if (button) {
    originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Running Tests...';
  }
  
  // Show progress
  const progressContainer = document.getElementById('batch-test-progress');
  const progressBar = document.getElementById('test-progress-bar');
  const progressText = document.getElementById('test-progress-text');
  progressContainer.style.display = 'block';
  
  const testResults = [];
  
  try {
    for (let i = 0; i < prebuiltQuestions.length; i++) {
      const question = prebuiltQuestions[i];
      const progress = ((i + 1) / prebuiltQuestions.length) * 100;
      
      progressBar.style.width = progress + '%';
      progressText.textContent = `Testing: "${question}" (${i + 1}/${prebuiltQuestions.length})`;
      
      try {
        // Use existing talk API
        const response = await fetch(`${serverUrl}/api/talk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: domain,
            text: question,
            user: 'setupWizardBatch',
            testing: true
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.message || 'No response received';
          
          testResults.push({
            question: question,
            response: aiResponse,
            success: true,
            responseLength: aiResponse.length,
            hasUsefulContent: aiResponse.length > 50 && !aiResponse.toLowerCase().includes('sorry') && !aiResponse.toLowerCase().includes("don't know")
          });
        } else {
          testResults.push({
            question: question,
            response: 'API Error',
            success: false,
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        testResults.push({
          question: question,
          response: 'Network Error',
          success: false,
          error: error.message
        });
      }
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Display results
    displayBatchTestResults(testResults);
    
    logWizardEvent('prebuilt_tests_completed', { 
      domain: domain,
      totalTests: testResults.length,
      successfulTests: testResults.filter(r => r.success).length
    });
    
  } catch (error) {
    console.error('Error running prebuilt tests:', error);
    alert('Error running tests: ' + error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = originalText;
    }
    progressContainer.style.display = 'none';
  }
};

// Ensure the setup test structure exists
const ensureSetupTestExists = async () => {
  const domain = setupWizardState.currentDomain;
  
  try {
    // Check if test already exists
    const response = await fetch(`${serverUrl}/api/getUserTests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: domain })
    });
    
    if (response.ok) {
      const tests = await response.json();
      const setupTest = tests.find(test => test.testName === setupWizardTestName);
      
      if (!setupTest) {
        // Create the setup wizard test
        await fetch(`${serverUrl}/api/createTest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            domain: domain, 
            testName: setupWizardTestName 
          })
        });
      }
    }
  } catch (error) {
    console.warn('Could not ensure setup test exists:', error);
  }
};

// Display batch test results
const displayBatchTestResults = (testResults) => {
  const resultsContainer = document.getElementById('batch-test-results');
  const summaryContainer = document.getElementById('test-results-summary');
  const detailsContainer = document.getElementById('test-results-details');
  
  const successCount = testResults.filter(r => r.success).length;
  const errorCount = testResults.filter(r => !r.success).length;
  const avgResponseLength = testResults.filter(r => r.success).reduce((sum, r) => sum + r.responseLength, 0) / successCount || 0;
  
  // Summary
  summaryContainer.innerHTML = `
    <div class="row">
      <div class="col-md-4 text-center">
        <h5>${testResults.length}</h5>
        <small>Total Tests</small>
      </div>
      <div class="col-md-4 text-center">
        <h5 class="text-success">${successCount}</h5>
        <small>Successful Responses</small>
      </div>
      <div class="col-md-4 text-center">
        <h5>${Math.round(avgResponseLength)}</h5>
        <small>Avg Response Length</small>
      </div>
    </div>
    ${errorCount > 0 ? `<div class="alert alert-warning mt-3"><i class="fas fa-exclamation-triangle"></i> ${errorCount} test(s) encountered errors</div>` : ''}
  `;
  
  // Detailed results - show full Q&A
  let tableHtml = '<div class="test-results-list">';
  
  testResults.forEach((result, index) => {
    const responseText = result.success ? result.response : `<span class="text-danger">Error: ${result.error || 'Unknown'}</span>`;
    
    tableHtml += `
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="fw-bold"><i class="fas fa-question-circle text-primary"></i> Question ${index + 1}:</h6>
          <p class="mb-3">${result.question}</p>
          
          <h6 class="fw-bold"><i class="fas fa-robot text-success"></i> Response:</h6>
          <p class="mb-3" style="white-space: pre-wrap;">${responseText}</p>
          
          ${result.success ? `
            <button class="btn btn-warning" onclick="createOverrideFromBatchTest(${index})">
              <i class="fas fa-edit"></i> Fix
            </button>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  tableHtml += '</div>';
  detailsContainer.innerHTML = tableHtml;
  
  // Store results globally for detail view
  window.setupBatchTestResults = testResults;
  
  resultsContainer.style.display = 'block';
};

// Create override from batch test result
const createOverrideFromBatchTest = (index) => {
  const results = window.setupBatchTestResults;
  if (!results || !results[index]) {
    alert('Test result not found.');
    return;
  }
  
  const result = results[index];
  
  // Create override data matching the expected format
  const overrideData = {
    domain: setupWizardState.currentDomain,
    reformedMessage: result.question,
    agentMessage: result.response
  };
  
  // Use existing override modal from transcripts.js
  if (typeof showOverrideResponseModal === 'function') {
    // Set domain cookie so the existing saveOverrideResponse function works correctly
    setCookie('domain', setupWizardState.currentDomain, 1);
    
    showOverrideResponseModal(overrideData);
    
    // The existing saveOverrideResponse function will work correctly now since we set the domain cookie
    // No need to override it - just let the modal use the existing function
    
  } else {
    // Fallback: create simple modal
    alert('Override modal not available. Please use the transcripts section to create overrides.');
  }
};

// Custom test suite creation
const createCustomTestSuite = () => {
  const modalHtml = `
    <div class="mb-3">
      <label for="customTestName" class="form-label">Test Suite Name:</label>
      <input type="text" id="customTestName" class="form-control" 
             value="Custom Setup Test ${Date.now()}" placeholder="Enter test name">
    </div>
    
    <div class="mb-3">
      <label class="form-label">Test Questions:</label>
      <div id="custom-questions-list">
        <!-- Questions will be added here -->
      </div>
      <button type="button" class="btn btn-secondary btn-sm" onclick="addCustomQuestion()">
        <i class="fas fa-plus"></i> Add Question
      </button>
    </div>
    
    <div class="mt-3">
      <button class="btn btn-primary" onclick="runCustomTestSuite()">
        <i class="fas fa-play"></i> Run Custom Test
      </button>
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
    </div>
  `;
  
  showModal('Create Custom Test Suite', modalHtml);
  
  // Add initial question
  addCustomQuestion();
};

// Add custom question to test suite
const addCustomQuestion = () => {
  const container = document.getElementById('custom-questions-list');
  const index = container.children.length;
  
  const questionHtml = `
    <div class="custom-question mb-3 p-3 border rounded" data-index="${index}">
      <div class="mb-2">
        <input type="text" class="form-control custom-question-input" 
               placeholder="Enter your test question" value="">
      </div>
      <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">
        <i class="fas fa-trash"></i> Remove
      </button>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', questionHtml);
};

// Run custom test suite
const runCustomTestSuite = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }
  
  // Collect questions
  const questions = [];
  document.querySelectorAll('.custom-question-input').forEach(input => {
    const question = input.value.trim();
    if (question) {
      questions.push(question);
    }
  });
  
  if (questions.length === 0) {
    alert('Please add at least one question.');
    return;
  }
  
  // Close modal and show progress
  hideModal();
  
  const progressContainer = document.getElementById('batch-test-progress');
  const progressBar = document.getElementById('test-progress-bar');
  const progressText = document.getElementById('test-progress-text');
  progressContainer.style.display = 'block';
  
  const testResults = [];
  
  try {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const progress = ((i + 1) / questions.length) * 100;
      
      progressBar.style.width = progress + '%';
      progressText.textContent = `Testing: "${question}" (${i + 1}/${questions.length})`;
      
      try {
        const response = await fetch(`${serverUrl}/api/talk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: domain,
            text: question,
            user: 'setupWizardCustom',
            testing: true
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.message || 'No response received';
          
          testResults.push({
            question: question,
            response: aiResponse,
            success: true,
            responseLength: aiResponse.length,
            hasUsefulContent: aiResponse.length > 50 && !aiResponse.toLowerCase().includes('sorry') && !aiResponse.toLowerCase().includes("don't know")
          });
        } else {
          testResults.push({
            question: question,
            response: 'API Error',
            success: false,
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        testResults.push({
          question: question,
          response: 'Network Error',
          success: false,
          error: error.message
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Display results
    displayBatchTestResults(testResults);
    
    logWizardEvent('custom_tests_completed', { 
      domain: domain,
      totalTests: testResults.length,
      successfulTests: testResults.filter(r => r.success).length
    });
    
  } catch (error) {
    console.error('Error running custom tests:', error);
    alert('Error running tests: ' + error.message);
  } finally {
    progressContainer.style.display = 'none';
  }
};

// Use a random test question
const useRandomTestQuestion = () => {
  const sampleQuestions = [
    "What services do you offer?",
    "How can I contact you?",
    "What are your business hours?",
    "Tell me about your company",
    "How much does it cost?",
    "Do you have any special offers?",
    "Where are you located?",
    "How do I get started?",
    "What is your return policy?",
    "Do you provide support?"
  ];
  
  const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
  document.getElementById('setup-test-question').value = randomQuestion;
};

// Initialize behavior for step 6
const initializeStep6Behavior = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    const statusDiv = document.getElementById('behavior-status');
    if (statusDiv) {
      statusDiv.innerHTML = '<div class="alert alert-warning">Please complete step 1 first to set your domain.</div>';
      statusDiv.style.display = 'block';
    }
    return;
  }
  
  // Set domain cookie for existing functions
  setCookie('domain', domain, 1);
  
  // Load existing behavior data
  await loadExistingAppearanceAndBehavior();
  
  logWizardEvent('behavior_step_initialized', { domain: domain });
};

// Initialize step 7 - Testing with regression questions
const initializeStep7Testing = () => {
  const domain = setupWizardState.currentDomain;
  
  // Initialize test results tracking
  if (!window.setupTestResults) {
    window.setupTestResults = { good: 0, needs_work: 0, batch_good: 0, batch_needs_work: 0 };
  }
  
  // Initialize batch test results storage
  window.setupBatchTestResults = [];
  
  // Initialize regression questions list
  if (!setupWizardState.regressionQuestions) {
    setupWizardState.regressionQuestions = [];
  }
  
  // Load existing questions
  loadRegressionQuestions();
  
  // Update question count
  updateQuestionCount();
  
  logWizardEvent('testing_step_initialized', { domain: domain });
};

// Regression test question management
const addRegressionQuestion = () => {
  const input = document.getElementById('new-regression-question');
  const question = input.value.trim();
  
  if (!question) {
    alert('Please enter a question.');
    return;
  }
  
  if (!setupWizardState.regressionQuestions) {
    setupWizardState.regressionQuestions = [];
  }
  
  setupWizardState.regressionQuestions.push(question);
  input.value = '';
  
  loadRegressionQuestions();
  updateQuestionCount();
  saveSetupWizardState();
  
  logWizardEvent('regression_question_added', { 
    domain: setupWizardState.currentDomain,
    question: question 
  });
};

const loadRegressionQuestions = () => {
  const container = document.getElementById('regression-questions-list');
  if (!container) return;
  
  const questions = setupWizardState.regressionQuestions || [];
  
  if (questions.length === 0) {
    container.innerHTML = '<p class="text-muted">No questions added yet.</p>';
    return;
  }
  
  // Check if test is running
  const isTestRunning = document.getElementById('batch-test-progress')?.style.display !== 'none';
  
  let html = '<div class="list-group">';
  questions.forEach((question, index) => {
    html += `
      <div class="list-group-item d-flex justify-content-between align-items-center">
        <p>${index + 1}. ${question}</p>
        <button class="btn btn-sm btn-outline-danger" onclick="removeRegressionQuestion(${index})" ${isTestRunning ? 'disabled' : ''}>
          Remove
        </button>
      </div>
    `;
  });
  html += '</div>';
  
  container.innerHTML = html;
};

const removeRegressionQuestion = (index) => {
  if (!setupWizardState.regressionQuestions) return;
  
  setupWizardState.regressionQuestions.splice(index, 1);
  loadRegressionQuestions();
  updateQuestionCount();
  saveSetupWizardState();
  
  logWizardEvent('regression_question_removed', { 
    domain: setupWizardState.currentDomain,
    index: index 
  });
};

const updateQuestionCount = () => {
  const countText = document.getElementById('question-count-text');
  const runTestSection = document.getElementById('run-test-section');
  
  if (!setupWizardState.regressionQuestions) {
    setupWizardState.regressionQuestions = [];
  }
  
  const count = setupWizardState.regressionQuestions.length;
  
  if (countText) {
    if (count < 5) {
      countText.textContent = `${count} questions added. Add at least ${5 - count} more to run the test.`;
    } else {
      countText.textContent = `${count} questions added. Ready to run test!`;
    }
  }
  
  // Show/hide run test section based on question count
  if (runTestSection) {
    runTestSection.style.display = count >= 5 ? 'block' : 'none';
  }
  
  // Enable/disable next button
  const nextBtn = document.getElementById('setup-next-btn');
  if (nextBtn && setupWizardState.currentStep === 6) {
    nextBtn.disabled = count < 5;
  }
};

const runRegressionTest = async () => {
  const domain = setupWizardState.currentDomain;
  if (!domain) {
    alert('Please complete step 1 first to set your domain.');
    return;
  }
  
  const questions = setupWizardState.regressionQuestions || [];
  if (questions.length < 5) {
    alert('Please add at least 5 questions before running the test.');
    return;
  }
  
  // Disable question input and add button during test
  const questionInput = document.getElementById('new-regression-question');
  const addButton = questionInput?.nextElementSibling;
  if (questionInput) questionInput.disabled = true;
  if (addButton) addButton.disabled = true;
  
  // Show progress
  const progressContainer = document.getElementById('batch-test-progress');
  const progressBar = document.getElementById('test-progress-bar');
  const progressText = document.getElementById('test-progress-text');
  progressContainer.style.display = 'block';
  
  // Reload questions to disable delete buttons
  loadRegressionQuestions();
  
  const testResults = [];
  
  try {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const progress = ((i + 1) / questions.length) * 100;
      
      progressBar.style.width = progress + '%';
      progressText.textContent = `Testing: "${question}" (${i + 1}/${questions.length})`;
      
      try {
        const response = await fetch(`${serverUrl}/api/talk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: domain,
            text: question,
            user: 'setupWizardRegression',
            testing: true
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.message || 'No response received';
          
          testResults.push({
            question: question,
            response: aiResponse,
            success: true,
            responseLength: aiResponse.length,
            hasUsefulContent: aiResponse.length > 50 && !aiResponse.toLowerCase().includes('sorry') && !aiResponse.toLowerCase().includes("don't know")
          });
        } else {
          testResults.push({
            question: question,
            response: 'API Error',
            success: false,
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        testResults.push({
          question: question,
          response: 'Network Error',
          success: false,
          error: error.message
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Display results
    displayBatchTestResults(testResults);
    
    logWizardEvent('regression_test_completed', { 
      domain: domain,
      totalTests: testResults.length,
      successfulTests: testResults.filter(r => r.success).length
    });
    
  } catch (error) {
    console.error('Error running regression test:', error);
    alert('Error running test: ' + error.message);
  } finally {
    progressContainer.style.display = 'none';
    
    // Re-enable question input and add button
    const questionInput = document.getElementById('new-regression-question');
    const addButton = questionInput?.nextElementSibling;
    if (questionInput) questionInput.disabled = false;
    if (addButton) addButton.disabled = false;
    
    // Reload questions to enable delete buttons
    loadRegressionQuestions();
  }
};
