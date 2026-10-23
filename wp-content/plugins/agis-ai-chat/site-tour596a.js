// AGIS Admin Panel Site Tour using Shepherd.js
console.log('Site tour script loaded');

// Initialize the tour
function initializeTour() {
    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-theme-arrows',
            scrollTo: { behavior: 'smooth', block: 'center' }
        }
    });

    // Step 1: Welcome
        tour.addStep({
            title: 'Welcome to AGIS Admin Panel!',
            text: `
                <p>Welcome to your AGIS AI management dashboard!</p>
                <p>This tour will guide you through the main features and help you get started.</p>
            `,
            attachTo: {
                element: '.navbar img',
                on: 'bottom'
            },
            advanceOn: { selector: '.navbar img', event: 'click' },
            buttons: [
                {
                    text: 'Skip Tour',
                    classes: 'shepherd-button-secondary',
                    action: tour.cancel
                },
                {
                    text: 'Start Tour',
                    action: tour.next
                }
            ]
        });

    // Step 2: Navigation Menu
        tour.addStep({
            title: 'Navigation Menu',
            text: `
                <p>Use these tabs to navigate between different sections:</p>
                <ul>
                    <li><strong>Manage AIs:</strong> Configure your AI assistants</li>
                    <li><strong>Manage Files:</strong> Upload and manage documents</li>
                    <li><strong>Look and Feel:</strong> Customize appearance</li>
                    <li><strong>Transcripts:</strong> View conversation logs</li>
                    <li><strong>Testing:</strong> Create and run tests</li>
                    <li><strong>Advanced:</strong> Advanced configuration</li>
                </ul>
            `,
            attachTo: {
                element: '#menuContent',
                on: 'bottom'
            },
            advanceOn: { selector: '#menuContent', event: 'click' },
            buttons: [
                {
                    text: 'Back',
                    classes: 'shepherd-button-secondary',
                    action: tour.back
                },
                {
                    text: 'Next',
                    action: tour.next
                }
            ]
        });

    // Step 3: Support & Features
        tour.addStep({
            title: 'Support & Feature Requests',
            text: `
                <p>Need help or have ideas for new features?</p>
                <ul>
                    <li><strong>Support:</strong> Get help with any issues</li>
                    <li><strong>Request a Feature:</strong> Submit new feature ideas</li>
                </ul>
            `,
            attachTo: {
                element: '.navbar .d-flex.align-items-center',
                on: 'bottom'
            },
            advanceOn: { selector: '.navbar .d-flex.align-items-center', event: 'click' },
            buttons: [
                {
                    text: 'Back',
                    classes: 'shepherd-button-secondary',
                    action: tour.back
                },
                {
                    text: 'Next',
                    action: tour.next
                }
            ]
        });

    // Step 4: Account Menu
        tour.addStep({
            title: 'Account Menu',
            text: `
                <p>Click here to access:</p>
                <ul>
                    <li><strong>Profile:</strong> Manage your account settings</li>
                    <li><strong>Subscriptions:</strong> View billing and plans</li>
                    <li><strong>Logout:</strong> Securely sign out</li>
                </ul>
            `,
            attachTo: {
                element: '.account-menu',
                on: 'left'
            },
            advanceOn: { selector: '.account-menu', event: 'click' },
            buttons: [
                {
                    text: 'Back',
                    classes: 'shepherd-button-secondary',
                    action: tour.back
                },
                {
                    text: 'Next',
                    action: tour.next
                }
            ]
        });

    // Step 5: Content Area
        tour.addStep({
            title: 'Set Up a New Chatbot',
            text: `
                <p>Let's walk through setting up a new chatbot.</p>
                <p>Click <strong>Manage AIs</strong> to begin the process.</p>
            `,
            attachTo: {
                element: '#tab-webpages',
                on: 'bottom'
            },
            advanceOn: { selector: '#tab-webpages', event: 'click' },
            buttons: [
                {
                    text: 'Back',
                    classes: 'shepherd-button-secondary',
                    action: tour.back
                },
                {
                    text: 'Go to Manage AIs',
                    action: function() {
                        loadPage('tab-webpages');
                        setTimeout(function() {
                            // Optionally, you can highlight the Add New site button if it has a selector
                            // and add another step for it
                            tour.addStep({
                                title: 'Add New Site',
                                text: '<p>Click here to add a new site and start configuring your chatbot.</p>',
                                attachTo: {
                                    element: '#AddNewSite',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#AddNewSite', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ]
                            });
                            tour.addStep({
                                title: 'Crawl Your Site',
                                text: '<p>Enter the site URL and maximum pages to crawl, then click <strong>Fetch</strong> to begin crawling your site and setting up your chatbot.</p>',
                                attachTo: {
                                    element: '#main-contents',
                                    on: 'top'
                                },
                                advanceOn: { selector: '.btn.btn-primary[onClick*="crawlSite"]', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ]
                            });
                            // Step: Go to Manage Files tab
                            tour.addStep({
                                title: 'Manage Files Tab',
                                text: '<p>The <strong>Manage Files</strong> tab is where you can view and add additional information for your chatbot, such as documents and files that help improve its responses.</p>',
                                attachTo: {
                                    element: '#tab-files',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#tab-files', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Go to Manage Files',
                                        action: function() {
                                            loadPage('tab-files');
                                            setTimeout(function() {
                                                tour.next();
                                            }, 500);
                                        }
                                    }
                                ]
                            });
                            // Step: Click Uploads button
                            tour.addStep({
                                title: 'Uploads Section',
                                text: '<p>Click the <strong>Uploads</strong> button to add new files and documents for your chatbot. This will open the upload interface.</p>',
                                attachTo: {
                                    element: '#UploadFiles',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#UploadFiles', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: function() {
                                            // Simulate click and advance after upload UI loads
                                            document.getElementById('UploadFiles').click();
                                            // Wait longer for the content to fully load and stabilize
                                            setTimeout(function() {
                                                tour.next();
                                            }, 1500); // Increased wait time for UI to update
                                        }
                                    }
                                ]
                            });
                            // Step: Find your site and click Upload Files
                            tour.addStep({
                                title: 'Upload Files for Your Site',
                                text: '<p>Find your newly added site in the list and click the <strong>Upload Files</strong> button next to it. You can select any domain from the list to upload files and further train your chatbot.</p>',
                                attachTo: {
                                    element: '#main-contents',
                                    on: 'top'
                                },
                                advanceOn: { selector: '.btn.btn-info[onclick^="renderUploadFile"]', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ],
                                beforeShowPromise: function() {
                                    return new Promise(function(resolve) {
                                        // Wait for the table to be fully loaded
                                        function checkForTable() {
                                            if (document.querySelector('table.table-striped.table-bordered')) {
                                                resolve();
                                            } else {
                                                setTimeout(checkForTable, 100);
                                            }
                                        }
                                        checkForTable();
                                    });
                                }
                            });
                            // Step: Go to Advanced tab
                            tour.addStep({
                                title: 'Advanced Tab',
                                text: '<p>The <strong>Advanced</strong> tab lets you access powerful configuration options for your chatbot, including personality, always included details, and language settings.</p>',
                                attachTo: {
                                    element: '#tab-advanced',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#tab-advanced', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Go to Advanced',
                                        action: function() {
                                            loadPage('tab-advanced');
                                            setTimeout(function() {
                                                tour.next();
                                            }, 500);
                                        }
                                    }
                                ]
                            });
                            // Step: Go to AI Config tab
                            tour.addStep({
                                title: 'AI Config Tab',
                                text: '<p>Click the <strong>AI Config</strong> button to configure your chatbot\'s personality, always included details, and supported languages.</p>',
                                attachTo: {
                                    element: '#AIConfig',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#AIConfig', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: function() {
                                            document.getElementById('AIConfig').click();
                                            setTimeout(function() {
                                                tour.next();
                                            }, 1500); // Wait for content to load
                                        }
                                    }
                                ]
                            });
                            // Step: Find site and Edit Personality
                            tour.addStep({
                                title: 'Edit Personality',
                                text: '<p>Find your site in the list and click <strong>Edit Personality</strong> to customize how your chatbot interacts with users.</p><p>When you are done, close the modal and press Next to continue.</p>',
                                attachTo: {
                                    element: '#main-contents',
                                    on: 'top'
                                },
                                advanceOn: { selector: '.btn.btn-primary[onclick^="editPersonality"]', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ],
                                beforeShowPromise: function() {
                                    return new Promise(function(resolve) {
                                        function checkForTable() {
                                            if (document.querySelector('table.table-striped.table-bordered')) {
                                                resolve();
                                            } else {
                                                setTimeout(checkForTable, 100);
                                            }
                                        }
                                        checkForTable();
                                    });
                                }
                            });
                            // Step: Open and explain Always Included
                            tour.addStep({
                                title: 'Always Included',
                                text: '<p>Click <strong>Always Included</strong> to specify details that your chatbot should always mention, regardless of the user\'s question. This helps reinforce important information.</p><p>When you are done, close the modal and press Next to continue.</p>',
                                attachTo: {
                                    element: '#main-contents',
                                    on: 'top'
                                },
                                advanceOn: { selector: '.btn.btn-primary[onclick^="editAlwaysIncluded"]', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ],
                                beforeShowPromise: function() {
                                    return new Promise(function(resolve) {
                                        function checkForTable() {
                                            if (document.querySelector('table.table-striped.table-bordered')) {
                                                resolve();
                                            } else {
                                                setTimeout(checkForTable, 100);
                                            }
                                        }
                                        checkForTable();
                                    });
                                }
                            });
                            // Step: Open and explain Languages
                            tour.addStep({
                                title: 'Languages',
                                text: '<p>Click <strong>Languages</strong> to set which languages your chatbot can speak. This ensures your chatbot responds appropriately to users in different languages.</p><p>When you are done, close the modal and press Next to continue.</p>',
                                attachTo: {
                                    element: '#main-contents',
                                    on: 'top'
                                },
                                advanceOn: { selector: '.btn.btn-primary[onclick^="editLanguages"]', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ],
                                beforeShowPromise: function() {
                                    return new Promise(function(resolve) {
                                        function checkForTable() {
                                            if (document.querySelector('table.table-striped.table-bordered')) {
                                                resolve();
                                            } else {
                                                setTimeout(checkForTable, 100);
                                            }
                                        }
                                        checkForTable();
                                    });
                                }
                            });
                            // Step: Go to Look and Feel tab
                            tour.addStep({
                                title: 'Look and Feel Tab',
                                text: '<p>The <strong>Look and Feel</strong> tab lets you customize the appearance and behavior of your chat client. Click here to get started.</p>',
                                attachTo: {
                                    element: '#tab-lookfeel',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#tab-lookfeel', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Go to Look and Feel',
                                        action: function() {
                                            loadPage('tab-lookfeel');
                                            setTimeout(function() {
                                                tour.next();
                                            }, 500);
                                        }
                                    }
                                ]
                            });
                            // Step: Select site from dropdown
                            tour.addStep({
                                title: 'Select Your Site',
                                text: '<p>Select your site from the dropdown to configure its chat client appearance and behavior.</p>',
                                attachTo: {
                                    element: '#availableDomains',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#availableDomains', event: 'change' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ]
                            });
                            // Step: Select Appearance
                            tour.addStep({
                                title: 'Appearance Settings',
                                text: '<p>Click <strong>Appearance</strong> to modify colors, fonts, and other visual aspects of your chat client. Here you can make your chat client match your brand and style.</p>',
                                attachTo: {
                                    element: '#Appearance',
                                    on: 'bottom'
                                },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: function() {
                                            document.getElementById('Appearance').click();
                                            tour.next();
                                        }
                                    }
                                ]
                            });
                            // Step: Select Chatbox Behavior
                            tour.addStep({
                                title: 'Chatbox Behavior',
                                text: '<p>Click <strong>Chatbox Behavior</strong> to configure how your chat client behaves, including icon, position, and default state. These settings help you control the user experience.</p>',
                                attachTo: {
                                    element: '#Behavior',
                                    on: 'bottom'
                                },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: function() {
                                            document.getElementById('Behavior').click();
                                            tour.next();
                                        }
                                    }
                                ]
                            });
                            // Step: Go to Testing tab
                            tour.addStep({
                                title: 'Testing Tab',
                                text: '<p>The <strong>Testing</strong> tab lets you create, run, and review tests for your chatbot. Click here to continue.</p>',
                                attachTo: {
                                    element: '#tab-testing',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#tab-testing', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Go to Testing',
                                        action: function() {
                                            loadPage('tab-testing');
                                            setTimeout(function() {
                                                tour.next();
                                            }, 500);
                                        }
                                    }
                                ]
                            });
                            // Step: Select site from dropdown
                            tour.addStep({
                                title: 'Select Your Site for Testing',
                                text: '<p>Select your site from the dropdown to view or create tests for it.</p>',
                                attachTo: {
                                    element: '#availableDomains',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#availableDomains', event: 'change' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ]
                            });
                            // Step: Click Create Test
                            tour.addStep({
                                title: 'Create Test',
                                text: '<p>Click <strong>Create Test</strong> to start a new test for your site. This will open a modal where you can define your test.</p>',
                                attachTo: {
                                    element: '#CreateTest',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#CreateTest', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: function() {
                                            document.getElementById('CreateTest').click();
                                            tour.next();
                                        }
                                    }
                                ]
                            });
                            // Step: Create Test Modal
                            tour.addStep({
                                title: 'Create Test Modal',
                                text: '<p>In this modal, enter the details for your new test and save it. When you are done, close the modal to continue the tour.</p>',
                                attachTo: {
                                    element: '.modal.show',
                                    on: 'top'
                                },
                                beforeShowPromise: function() {
                                    return new Promise(function(resolve) {
                                        function checkForModal() {
                                            if (document.querySelector('.modal.show')) {
                                                resolve();
                                            } else {
                                                setTimeout(checkForModal, 100);
                                            }
                                        }
                                        checkForModal();
                                    });
                                },
                                buttons: [
                                    {
                                        text: 'Next (after closing modal)',
                                        action: function() {
                                            // Wait for modal to be closed
                                            function waitForModalClose() {
                                                if (!document.querySelector('.modal.show')) {
                                                    tour.next();
                                                } else {
                                                    setTimeout(waitForModalClose, 500);
                                                }
                                            }
                                            waitForModalClose();
                                        }
                                    }
                                ]
                            });
                            // Step: Click View Test
                            tour.addStep({
                                title: 'View Test',
                                text: '<p>Click <strong>View Tests</strong> to see the list of tests for your site. Here you can run and review your tests.</p>',
                                attachTo: {
                                    element: '#ViewTest',
                                    on: 'bottom'
                                },
                                advanceOn: { selector: '#ViewTest', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: function() {
                                            document.getElementById('ViewTest').click();
                                            setTimeout(function() {
                                                tour.next();
                                            }, 1000); // Increased wait time for content to load
                                        }
                                    }
                                ]
                            });
                            // Step: Select View Test for your created test
                            tour.addStep({
                                title: 'View Test for Your Created Test',
                                text: '<p>Find the test you just created in the table and click <strong>View Test</strong> next to it to see the test details and run it.</p>',
                                attachTo: {
                                    element: '#main-contents',
                                    on: 'top'
                                },
                                advanceOn: { selector: '.btn.btn-primary[onclick^="showTest"]', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ],
                                beforeShowPromise: function() {
                                    return new Promise(function(resolve) {
                                        function checkForTestTable() {
                                            // Wait for both the table and the showTest buttons to be present
                                            const table = document.querySelector('table.table-striped.table-bordered');
                                            const showTestButtons = document.querySelectorAll('.btn.btn-primary[onclick^="showTest"]');
                                            
                                            if (table && showTestButtons.length > 0) {
                                                // Additional wait to ensure content is fully rendered
                                                setTimeout(function() {
                                                    resolve();
                                                }, 500);
                                            } else {
                                                setTimeout(checkForTestTable, 100);
                                            }
                                        }
                                        checkForTestTable();
                                    });
                                }
                            });
                            // Step: Run Test
                            tour.addStep({
                                title: 'Run Test',
                                text: '<p>Run your test to see how your chatbot responds to different questions. Review the results to ensure your chatbot is performing as expected.</p>',
                                attachTo: {
                                    element: '.modal.show',
                                    on: 'top'
                                },
                                advanceOn: { selector: '.btn.btn-primary[onclick^="runTest"]', event: 'click' },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ],
                                beforeShowPromise: function() {
                                    return new Promise(function(resolve) {
                                        function checkForModal() {
                                            if (document.querySelector('.modal.show')) {
                                                resolve();
                                            } else {
                                                setTimeout(checkForModal, 100);
                                            }
                                        }
                                        checkForModal();
                                    });
                                }
                            });
                            // Step: Create Override
                            tour.addStep({
                                title: 'Create Override',
                                text: '<p>If a test question produces an undesired response, click <strong>Create Override</strong> to specify a better answer for your chatbot.</p><p>In the Create Override modal, you can provide a custom answer for a specific question. This helps your chatbot give the best possible responses. When finished, close the modal and press Next to continue.</p>',
                                attachTo: {
                                    element: '.modal.show',
                                    on: 'top'
                                },
                                buttons: [
                                    {
                                        text: 'Next',
                                        action: tour.next
                                    }
                                ],
                                beforeShowPromise: function() {
                                    return new Promise(function(resolve) {
                                        function checkForModal() {
                                            if (document.querySelector('.modal.show') && document.querySelector('.btn.btn-primary[onclick^="createOverride"]')) {
                                                resolve();
                                            } else {
                                                setTimeout(checkForModal, 100);
                                            }
                                        }
                                        checkForModal();
                                    });
                                }
                            });
                            // Step: Tour Complete
                            tour.addStep({
                                title: 'Tour Complete!',
                                text: '<p>You have completed the onboarding tour! You are now ready to go live with your chatbot. Good luck!</p>',
                                buttons: [
                                    {
                                        text: 'Finish',
                                        action: tour.complete
                                    }
                                ]
                            });
                            tour.next();
                        }, 500);
                    }
                }
            ]
        });

    return tour;
}

// Start the tour
function startSiteTour() {
    const tour = initializeTour();
    tour.start();
}

// Optional: Start tour automatically for new users
function checkAndStartTour() {
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('agis-tour-completed');
    
    if (!hasSeenTour) {
        // Show a prompt to start the tour
        setTimeout(() => {
            if (confirm('Would you like to take a quick tour of the admin panel?')) {
                startSiteTour();
                localStorage.setItem('agis-tour-completed', 'true');
            }
        }, 1000); // Wait 1 second after page load
    }
}

// Advanced tour for specific sections
function startTestingTour() {
    const testingTour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-theme-arrows',
            scrollTo: { behavior: 'smooth', block: 'center' }
        }
    });

    testingTour.addStep({
        title: 'Testing Section',
        text: `
            <p>Welcome to the Testing section!</p>
            <p>Here you can create and manage regression tests for your AI assistants.</p>
        `,
        buttons: [
            {
                text: 'Got it!',
                action: testingTour.complete
            }
        ]
    });

    testingTour.start();
}

// Export functions for global use
window.startSiteTour = startSiteTour;
window.checkAndStartTour = checkAndStartTour;
window.startTestingTour = startTestingTour;
