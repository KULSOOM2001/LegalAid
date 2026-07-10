<!DOCTYPE html>
<html>
<head>
    <style>
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        
        .role-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        
        .role-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4F46E5, #7C3AED, #EC4899);
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }
        
        .role-card:hover::before {
            transform: scaleX(1);
        }
        
        .role-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .role-emoji {
            font-size: 3rem;
            display: block;
            margin-bottom: 12px;
        }
        
        .role-name {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .role-email {
            color: #6B7280;
            font-size: 0.875rem;
            margin-bottom: 12px;
        }
        
        .role-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .badge-admin { background: #FEE2E2; color: #991B1B; }
        .badge-supervisor { background: #DBEAFE; color: #1E40AF; }
        .badge-volunteer { background: #D1FAE5; color: #065F46; }
        .badge-citizen { background: #FEF3C7; color: #92400E; }
    </style>
</head>
<body>
    <div class="dashboard-grid">
        <!-- Admin Card -->
        <div class="role-card">
            <span class="role-emoji">👑</span>
            <div class="role-name">System Administrator</div>
            <div class="role-email">admin@legalaid.test</div>
            <span class="role-badge badge-admin">🔑 Full Access</span>
        </div>
        
        <!-- Supervisor Card -->
        <div class="role-card">
            <span class="role-emoji">👔</span>
            <div class="role-name">Supervisor</div>
            <div class="role-email">supervisor@legalaid.test</div>
            <span class="role-badge badge-supervisor">📋 Oversight</span>
        </div>
        
        <!-- Volunteer Cards -->
        <div class="role-card">
            <span class="role-emoji">⭐</span>
            <div class="role-name">Senior Volunteer</div>
            <div class="role-email">volunteer1@legalaid.test</div>
            <span class="role-badge badge-volunteer">⚖️ 15 Cases</span>
        </div>
        
        <div class="role-card">
            <span class="role-emoji">🌱</span>
            <div class="role-name">Junior Volunteer</div>
            <div class="role-email">volunteer2@legalaid.test</div>
            <span class="role-badge badge-volunteer">📁 8 Cases</span>
        </div>
        
        <!-- Citizen Cards -->
        <div class="role-card">
            <span class="role-emoji">🏠</span>
            <div class="role-name">Citizen (Premium)</div>
            <div class="role-email">citizen1@legalaid.test</div>
            <span class="role-badge badge-citizen">📄 3 Cases</span>
        </div>
        
        <div class="role-card">
            <span class="role-emoji">🏡</span>
            <div class="role-name">Citizen (Standard)</div>
            <div class="role-email">citizen2@legalaid.test</div>
            <span class="role-badge badge-citizen">📄 1 Case</span>
        </div>
    </div>
</body>
</html>
