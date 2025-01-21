// Show/hide sections
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    
    if (sectionId === 'writers') {
        loadWriters();
        loadFilterOptions();
    }
}

// Toggle FAQ items
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const wasActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!wasActive) {
        faqItem.classList.add('active');
    }
}

// Load filter options
async function loadFilterOptions() {
    try {
        // Load colleges
        const collegesResponse = await fetch('/api/colleges');
        const colleges = await collegesResponse.json();
        
        const collegeSelect = document.getElementById('collegeFilter');
        collegeSelect.innerHTML = '<option value="">All Colleges</option>' +
            colleges.map(college => `<option value="${college}">${college}</option>`).join('');

        // Load branches
        const branchesResponse = await fetch('/api/branches');
        const branches = await branchesResponse.json();
        
        const branchSelect = document.getElementById('branchFilter');
        branchSelect.innerHTML = '<option value="">All Branches</option>' +
            branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Create Gmail compose URL
function createEmailTemplate(writer) {
    const subject = `Assignment Writing Request - ${writer.college_name}`;
    const body = `Dear ${writer.first_name} ${writer.last_name},

I found your profile on BariGuru and I'm interested in having you write an assignment for me. 

Assignment Details:
- Subject: [Please specify]
- Number of pages: [Please specify]
- Deadline: [Please specify]
- Additional requirements: [Please specify]

Looking forward to your response.

Best regards,
[Your name]`;

    // Create Gmail compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(writer.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    return gmailUrl;
}

// Load writers
async function loadWriters(college = '', branch = '') {
    const writersList = document.getElementById('writersList');
    writersList.innerHTML = '<div class="loading">Loading writers...</div>';

    try {
        let url = '/api/writers';
        if (college || branch) {
            const params = new URLSearchParams();
            if (college) params.append('college', college);
            if (branch) params.append('branch', branch);
            url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        const writers = await response.json();

        if (writers.length === 0) {
            writersList.innerHTML = '<div class="no-results">No writers found matching your criteria.</div>';
            return;
        }

        writersList.innerHTML = writers.map(writer => `
            <div class="writer-card">
                <h3>${writer.first_name} ${writer.last_name}</h3>
                <p><i class="fas fa-university"></i> College: ${writer.college_name}</p>
                <p><i class="fas fa-book"></i> Branch: ${writer.branch}</p>
                <p><i class="fas fa-rupee-sign"></i> Rate: ₹${writer.rate_per_ten_pages} per 10 pages</p>
                <a href="${createEmailTemplate(writer)}" target="_blank" class="contact-button">
                    <i class="fas fa-envelope"></i> Contact Writer
                </a>
            </div>
        `).join('');
    } catch (error) {
        writersList.innerHTML = '<div class="error">Error loading writers. Please try again.</div>';
        console.error('Error:', error);
    }
}

// Filter writers
function filterWriters() {
    const college = document.getElementById('collegeFilter').value;
    const branch = document.getElementById('branchFilter').value;
    loadWriters(college, branch);
}

// Handle writer application form
document.getElementById('writerApplicationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    // Get the file from the file input
    const fileInput = document.getElementById('studentId');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload your Student ID card image.');
        return;
    }

    try {
        // First, upload the file
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/upload-student-id', {
            method: 'POST',
            body: formData
        });

        const uploadResult = await uploadResponse.json();
        
        if (!uploadResult.success) {
            throw new Error(uploadResult.message || 'Failed to upload file');
        }

        // Then submit the form data with the file URL
        const applicationData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            collegeName: document.getElementById('collegeName').value,
            branch: document.getElementById('branch').value,
            email: document.getElementById('email').value,
            ratePerTenPages: parseFloat(document.getElementById('ratePerTenPages').value),
            studentIdUrl: uploadResult.url
        };

        console.log("Sending form data:", applicationData);

        const response = await fetch('/api/writers/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(applicationData)
        });

        const result = await response.json();
        console.log("Server response:", result);

        if (result.success) {
            alert('Application submitted successfully! We will review your application.');
            e.target.reset();
            showSection('main');
        } else {
            alert(result.message || 'Error submitting application. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('An unexpected error occurred. Please try again later.');
    }
});