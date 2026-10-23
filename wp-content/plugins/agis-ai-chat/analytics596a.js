console.log('AGIS - Analytics Loaded')

const analyticsEntry = () => {
    console.log('Loading analytics dashboard');
    jQuery('#content-area').html(analyticsOptionsHtml);
    populateAnalyticsDomainSelect();
    setSection('analytics');
}

const analyticsOptionsHtml = `
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <h3><i class="fas fa-chart-pie"></i> Analytics Dashboard</h3>
            <p class="text-muted">View conversation analytics and insights for your domains</p>
        </div>
    </div>
    
    <div class="row mb-4">
        <div class="col-md-6">
            <div class="form-group">
                <label for="analyticsDomainSelect">Select Domain:</label>
                <select class="form-control" id="analyticsDomainSelect" onchange="loadAnalyticsDashboard()">
                    <option value="">Select a domain...</option>
                </select>
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-group">
                <label for="analyticsDateRange">Date Range:</label>
                <select class="form-control" id="analyticsDateRange" onchange="loadAnalyticsDashboard()">
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                    <option value="all">All time</option>
                </select>
            </div>
        </div>
    </div>
    
    <div id="analytics-dashboard">
        <div class="text-center text-muted">
            <i class="fas fa-chart-pie fa-3x mb-3"></i>
            <p>Select a domain to view analytics</p>
        </div>
    </div>
</div>
`;

const loadAnalyticsDashboard = async () => {
    const domain = document.getElementById('analyticsDomainSelect').value;
    const dateRange = document.getElementById('analyticsDateRange').value;
    
    if (!domain) {
        document.getElementById('analytics-dashboard').innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-chart-pie fa-3x mb-3"></i>
                <p>Select a domain to view analytics</p>
            </div>
        `;
        return;
    }
    
    // Show loading state
    document.getElementById('analytics-dashboard').innerHTML = `
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading analytics...</span>
            </div>
            <p class="mt-2">Loading analytics for ${domain}...</p>
        </div>
    `;
    
    try {
        // Fetch analytics data
        const analyticsData = await fetchAnalyticsData(domain, dateRange);
        renderAnalyticsDashboard(analyticsData, domain);
    } catch (error) {
        console.error('Error loading analytics:', error);
        document.getElementById('analytics-dashboard').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Error loading analytics data. Please try again.
            </div>
        `;
    }
};

const fetchAnalyticsData = async (domain, dateRange) => {
    const payload = { 
        domain: domain,
        dateRange: dateRange === 'all' ? null : parseInt(dateRange)
    };
    
    const response = await fetch(`${serverUrl}/api/getAnalyticsData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
    }
    
    return response.json();
};

const renderAnalyticsDashboard = (data, domain) => {
    const capturedEmailsHtml = renderCapturedEmailsHtml(data.capturedEmails || []);
    const dashboard = `
        <div class="row">
            <!-- Summary Cards -->
            <div class="col-md-3 mb-4">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 class="card-title">${data.totalQueries || 0}</h4>
                                <p class="card-text">Total Queries</p>
                            </div>
                            <i class="fas fa-comments fa-2x"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-4">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 class="card-title">${data.avgResponseTime || 0}s</h4>
                                <p class="card-text">Avg Response Time</p>
                            </div>
                            <i class="fas fa-clock fa-2x"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-4">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 class="card-title">${data.topIntent || 'N/A'}</h4>
                                <p class="card-text">Top Intent</p>
                            </div>
                            <i class="fas fa-bullseye fa-2x"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-4">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 class="card-title">${data.positiveSentiment || 0}%</h4>
                                <p class="card-text">Positive Sentiment</p>
                            </div>
                            <i class="fas fa-smile fa-2x"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <!-- Intent Distribution Chart -->
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-chart-pie"></i> Queries by Intent</h5>
                    </div>
                    <div class="card-body">
                        <div id="intent-chart" style="height: 400px;">
                            <canvas id="intentPieChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sentiment Distribution -->
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-chart-bar"></i> Sentiment Distribution</h5>
                    </div>
                    <div class="card-body">
                        <div id="sentiment-chart" style="height: 400px;">
                            <canvas id="sentimentBarChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <!-- Query Timeline -->
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-chart-line"></i> Query Timeline</h5>
                    </div>
                    <div class="card-body">
                        <div id="timeline-chart" style="height: 300px;">
                            <canvas id="timelineChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-envelope-open-text"></i> Captured Emails</h5>
                        <span class="badge bg-secondary">${(data.capturedEmails || []).length} total</span>
                    </div>
                    <div class="card-body">
                        ${capturedEmailsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('analytics-dashboard').innerHTML = dashboard;
    
    // Render charts after DOM is updated
    setTimeout(() => {
        renderIntentPieChart(data.intentDistribution || {});
        renderSentimentBarChart(data.sentimentDistribution || {});
        renderTimelineChart(data.queryTimeline || []);
    }, 100);
};

const renderIntentPieChart = (intentData) => {
    const ctx = document.getElementById('intentPieChart');
    if (!ctx) return;
    
    const labels = Object.keys(intentData);
    const data = Object.values(intentData);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
};

const renderSentimentBarChart = (sentimentData) => {
    const ctx = document.getElementById('sentimentBarChart');
    if (!ctx) return;
    
    const labels = Object.keys(sentimentData);
    const data = Object.values(sentimentData);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Queries',
                data: data,
                backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#6c757d'],
                borderColor: ['#1e7e34', '#d39e00', '#bd2130', '#495057'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

const renderTimelineChart = (timelineData) => {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    const labels = timelineData.map(item => item.date);
    const data = timelineData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Queries per Day',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

function renderCapturedEmailsHtml(emails = []) {
    if (!emails.length) {
        return `
            <div class="text-center text-muted">
                <i class="fas fa-inbox fa-2x mb-2"></i>
                <p class="mb-0">No emails captured for this domain yet.</p>
            </div>
        `;
    }

    const rows = emails.map((item, index) => {
        const label = index + 1;
        const displayEmail = escapeHtml(item.email || '');
        const transcriptId = item.transcriptId ? escapeHtml(item.transcriptId) : '—';
        const snippet = escapeHtml((item.messageSnippet || '').slice(0, 160));
        const timestamp = item.updatedAt || item.createdAt;
        const readable = timestamp ? new Date(timestamp).toLocaleString() : '—';

        return `
            <tr>
                <td class="agis-email-captured">${label}</td>
                <td class="fw-semibold agis-email-captured">${displayEmail}</td>
                <td class="agis-email-captured">${transcriptId}</td>
                <td class="agis-email-captured">${snippet || '—'}</td>
                <td class="agis-email-captured">${readable}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-responsive">
            <table class="table table-sm align-middle agis-email-captured">
                <thead>
                    <tr>
                        <th class="agis-email-captured">#</th>
                        <th class="agis-email-captured">Email</th>
                        <th class="agis-email-captured">Transcript ID</th>
                        <th class="agis-email-captured">Message Snippet</th>
                        <th class="agis-email-captured">Last Captured</th>
                    </tr>
                </thead>
                <tbody class="agis-email-captured">
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// Populate domain dropdown
const populateAnalyticsDomainSelect = async () => {
    try {
        const domains = await getDomainsByAccount();
        const select = document.getElementById('analyticsDomainSelect');
        if (!select) return;
        // Clear existing options and add the default placeholder
        select.innerHTML = '<option value="">Select a domain...</option>';
        
        // Populate domain options
        domains.forEach(domain => {
            const option = document.createElement('option');
            option.value = domain;
            option.textContent = domain;
            select.appendChild(option);
        });

        // Auto-select if only one domain
        if (domains.length === 1) {
            const onlyDomain = domains[0];
            select.value = onlyDomain;

            // Trigger a change event so listeners respond properly
            const event = new Event('change');
            select.dispatchEvent(event);

            console.log(`Auto-selected analytics domain: ${onlyDomain}`);
        }
    } catch (error) {
        console.error('Error populating domain select:', error);
    }
};


// Initialize domain select when analytics tab is loaded
document.addEventListener('DOMContentLoaded', function() {
    // This will run when the page loads, but we also need to call it when the tab is clicked
    setTimeout(populateAnalyticsDomainSelect, 1000);
});
