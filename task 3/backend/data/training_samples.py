TRAINING_DATA = [
    {
        "id": 1,
        "category": "phishing",
        "sender": "Netflix Support <security@netflix-verify.tk>",
        "subject": "URGENT: Your Netflix Account Will Be Suspended",
        "body": (
            "Dear Customer,\n\n"
            "We detected unusual activity on your Netflix account. "
            "To avoid suspension, please verify your billing information immediately.\n\n"
            "Click here to verify: http://netflix.secure-update.tk/verify\n\n"
            "Failure to verify within 24 hours will result in account termination.\n\n"
            "Thank you,\nNetflix Security Team"
        ),
        "url": "http://netflix.secure-update.tk/verify",
        "red_flags": ["suspicious_url", "urgent_language", "threat_language", "brand_impersonation", "generic_greeting"],
        "explanation": "This is a phishing email attempting to steal Netflix credentials. The domain 'netflix.secure-update.tk' uses a suspicious .tk TLD and impersonates Netflix in the subdomain rather than being sent from netflix.com.",
        "difficulty": 2,
    },
    {
        "id": 2,
        "category": "phishing",
        "sender": "CEO <ceo@company-corp.co>",
        "subject": "Wire Transfer Authorization - URGENT",
        "body": (
            "Team,\n\n"
            "I need you to process an urgent wire transfer to our new vendor. "
            "This is confidential and must be completed within 1 hour.\n\n"
            "Amount: $45,000\n"
            "Vendor: GlobalTech Solutions\n"
            "Account: 987654321\n\n"
            "Do not discuss this with anyone. Bypass standard approval.\n\n"
            "- CEO"
        ),
        "url": None,
        "red_flags": ["authority_impersonation", "urgent_language", "sensitive_info", "secrecy_request"],
        "explanation": "This is a Business Email Compromise (BEC) attack impersonating a CEO. The urgency, the instruction to bypass approval, and the request for secrecy around a large wire transfer are classic red flags.",
        "difficulty": 3,
    },
    {
        "id": 3,
        "category": "legitimate",
        "sender": "Sarah Lee <sarah.lee@company.com>",
        "subject": "Q3 Project Status Update",
        "body": (
            "Hi Team,\n\n"
            "Please review the attached Q3 project status report at your convenience.\n\n"
            "No immediate action required - just keep this in mind for our next meeting.\n\n"
            "Best,\nSarah"
        ),
        "url": None,
        "red_flags": [],
        "explanation": "This is a legitimate internal email with a valid sender domain, no urgency, and no request for sensitive information.",
        "difficulty": 1,
    },
    {
        "id": 4,
        "category": "phishing",
        "sender": "Apple Support <support@apple-icloud.shop>",
        "subject": "Your Apple ID Has Been Compromised",
        "body": (
            "Dear Apple User,\n\n"
            "We detected unauthorized login attempts to your Apple ID from an unknown device.\n\n"
            "To secure your account, please confirm your identity immediately:\n\n"
            "[Verify Your Account]\n\n"
            "If this wasn't you, you must verify your account within 12 hours.\n\n"
            "Apple Security Team"
        ),
        "url": "http://apple-icloud.shop/verify-id",
        "red_flags": ["brand_impersonation", "urgent_language", "threat_language", "sensitive_info", "generic_greeting"],
        "explanation": "This is a phishing attempt targeting Apple ID credentials. The domain 'apple-icloud.shop' is not owned by Apple, and the .shop TLD combined with urgency is a strong indicator of phishing.",
        "difficulty": 2,
    },
    {
        "id": 5,
        "category": "phishing",
        "sender": "HR Department <hr@company-benefits.co>",
        "subject": "IMPORTANT: Healthcare Benefits Update",
        "body": (
            "Hello,\n\n"
            "This is a reminder to complete your 2026 healthcare benefits enrollment. "
            "All employees must confirm their selections by 5PM today.\n\n"
            "Click here to complete enrollment: http://company-benefits.click/enroll\n\n"
            "Required fields include:\n"
            "- Social Security Number\n"
            "- Dependent information\n"
            "- Beneficiary details\n\n"
            "HR Department"
        ),
        "url": "http://company-benefits.click/enroll",
        "red_flags": ["urgent_language", "sensitive_info", "suspicious_url"],
        "explanation": "This is a credential harvesting attempt disguised as HR benefits enrollment. The .click TLD is unusual for HR communications, and the request for a Social Security Number through email is a major red flag.",
        "difficulty": 3,
    },
    {
        "id": 6,
        "category": "legitimate",
        "sender": "Finance Department <finance@company.com>",
        "subject": "Monthly Expense Report - Due Friday",
        "body": (
            "Hi All,\n\n"
            "Just a friendly reminder that monthly expense reports are due this Friday. "
            "Please submit via the expense portal as usual.\n\n"
            "Let me know if you have questions.\n\n"
            "Thanks,\nFinance Team"
        ),
        "url": None,
        "red_flags": [],
        "explanation": "This is a legitimate internal reminder with no urgency, no suspicious links, and no request for sensitive information.",
        "difficulty": 1,
    },
    {
        "id": 7,
        "category": "phishing",
        "sender": "LinkedIn <noreply@linkedin-com-verify.ml>",
        "subject": "Someone Viewed Your Profile",
        "body": (
            "Hi there,\n\n"
            "A senior recruiter from Google viewed your LinkedIn profile.\n\n"
            "Upgrade to Premium to see who viewed your profile.\n\n"
            "[See Who Viewed Your Profile]\n\n"
            "Don't miss this opportunity!"
        ),
        "url": "http://linkedin-com-verify.ml/premium",
        "red_flags": ["brand_impersonation", "suspicious_url", "generic_greeting"],
        "explanation": "This is a phishing attempt exploiting curiosity about profile views. The domain 'linkedin-com-verify.ml' is a clear impersonation using a free .ml TLD, not the real linkedin.com.",
        "difficulty": 2,
    },
    {
        "id": 8,
        "category": "phishing",
        "sender": "PayPal <service@paypal-login.world>",
        "subject": "Your PayPal Account Has Been Limited",
        "body": (
            "Dear PayPal Member,\n\n"
            "We have temporarily limited your account due to suspicious activity.\n\n"
            "To restore full access, you must verify your identity:\n"
            "1. Sign in to your PayPal account\n"
            "2. Verify your identity with two-factor authentication\n"
            "3. Confirm your recent transactions\n\n"
            "[Verify Account Now]\n\n"
            "Failure to verify will result in permanent account limitation.\n\n"
            "PayPal Service Center"
        ),
        "url": "http://paypal-login.world/verify",
        "red_flags": ["brand_impersonation", "urgent_language", "threat_language", "sensitive_info", "generic_greeting"],
        "explanation": "This is a classic PayPal phishing attempt designed to steal credentials and 2FA codes. The domain 'paypal-login.world' is not affiliated with PayPal.",
        "difficulty": 2,
    },
    {
        "id": 9,
        "category": "legitimate",
        "sender": "IT Support <it-support@company.com>",
        "subject": "Password Reset - Reminder",
        "body": (
            "Team,\n\n"
            "This is a reminder that your password will expire in 30 days. "
            "Please change it at your convenience using the internal portal.\n\n"
            "Contact IT if you need assistance.\n\n"
            "IT Support"
        ),
        "url": None,
        "red_flags": [],
        "explanation": "This is a legitimate IT notification with no urgency, no external links, and no suspicious requests.",
        "difficulty": 1,
    },
    {
        "id": 10,
        "category": "phishing",
        "sender": "Microsoft Support <alert@microsoft-verify.tech>",
        "subject": "Action Required: Email Account Security",
        "body": (
            "Dear User,\n\n"
            "Your Microsoft account was signed in from an unusual location.\n\n"
            "Review recent activity: [Review Activity]\n\n"
            "If this was not you, you must secure your account immediately.\n\n"
            "Microsoft Security Team"
        ),
        "url": "http://microsoft-verify.tech/review-activity",
        "red_flags": ["brand_impersonation", "urgent_language", "suspicious_url", "generic_greeting"],
        "explanation": "This is a phishing attempt targeting Microsoft account credentials. The domain 'microsoft-verify.tech' is not owned by Microsoft, and the .tech TLD paired with urgent account-security language is a common phishing pattern.",
        "difficulty": 2,
    },
]
