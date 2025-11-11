
import React from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle, Clock, Zap, Users, BarChart3, Brain } from 'lucide-react';

const ProjectDocumentation: React.FC = () => {
  const generatePDF = () => {
    const content = document.getElementById('documentation-content');
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Goal Mate Project Documentation</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body { 
            font-family: 'Inter', sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            background: #ffffff; 
            padding: 40px; 
            max-width: 1200px; 
            margin: 0 auto; 
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 50px; 
            padding-bottom: 30px; 
            border-bottom: 3px solid #3b82f6; 
          }
          
          .logo { 
            font-size: 3em; 
            font-weight: 700; 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            margin-bottom: 10px; 
          }
          
          .subtitle { 
            font-size: 1.2em; 
            color: #6b7280; 
            font-weight: 400; 
          }
          
          .section { 
            margin-bottom: 50px; 
          }
          
          .section-title { 
            font-size: 1.8em; 
            font-weight: 600; 
            color: #1f2937; 
            margin-bottom: 20px; 
            padding-bottom: 10px; 
            border-bottom: 2px solid #e5e7eb; 
          }
          
          .subsection { 
            margin-bottom: 30px; 
          }
          
          .subsection-title { 
            font-size: 1.3em; 
            font-weight: 600; 
            color: #374151; 
            margin-bottom: 15px; 
          }
          
          .feature-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
          }
          
          .feature-card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 12px; 
            border-left: 4px solid #3b82f6; 
          }
          
          .feature-title { 
            font-weight: 600; 
            color: #1f2937; 
            margin-bottom: 8px; 
            display: flex; 
            align-items: center; 
            gap: 8px; 
          }
          
          .feature-desc { 
            color: #6b7280; 
            font-size: 0.95em; 
          }
          
          .status-badge { 
            display: inline-flex; 
            align-items: center; 
            gap: 6px; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.85em; 
            font-weight: 500; 
            margin-bottom: 10px; 
          }
          
          .completed { background: #dcfce7; color: #166534; }
          .planned { background: #fef3c7; color: #92400e; }
          .future { background: #e0e7ff; color: #3730a3; }
          
          .tech-stack { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 15px; 
            margin: 20px 0; 
          }
          
          .tech-item { 
            background: #3b82f6; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 0.9em; 
            font-weight: 500; 
          }
          
          .timeline { 
            margin: 30px 0; 
          }
          
          .timeline-item { 
            display: flex; 
            gap: 20px; 
            margin-bottom: 25px; 
            padding-left: 20px; 
            border-left: 3px solid #e5e7eb; 
          }
          
          .timeline-date { 
            font-weight: 600; 
            color: #3b82f6; 
            min-width: 100px; 
          }
          
          .architecture-diagram { 
            background: #f8fafc; 
            padding: 30px; 
            border-radius: 12px; 
            margin: 20px 0; 
            text-align: center; 
          }
          
          .diagram-title { 
            font-weight: 600; 
            margin-bottom: 20px; 
            color: #374151; 
          }
          
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">StudyBuddy</div>
          <div class="subtitle">AI-Powered Learning Platform - Project Documentation</div>
          <div style="color: #6b7280; margin-top: 10px;">Generated on ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="section">
          <div class="section-title">📋 Executive Summary</div>
          <p>StudyBuddy is a comprehensive AI-powered learning platform designed to revolutionize how students study and learn. The platform combines artificial intelligence with modern web technologies to provide personalized learning experiences, intelligent study planning, and interactive educational tools.</p>
        </div>

        <div class="section">
          <div class="section-title">🚀 Current Implementation</div>
          
          <div class="subsection">
            <div class="subsection-title">Core Features (Completed)</div>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="status-badge completed"><CheckCircle size={14}/> IMPLEMENTED</div>
                <div class="feature-title">🤖 AI Study Buddy Chat</div>
                <div class="feature-desc">Real-time AI tutoring with Gemini 2.0 Flash integration, streaming responses, and conversation history</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge completed"><CheckCircle size={14}/> IMPLEMENTED</div>
                <div class="feature-title">📚 Study Plan Generator</div>
                <div class="feature-desc">AI-generated personalized study schedules with subject allocation and time management</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge completed"><CheckCircle size={14}/> IMPLEMENTED</div>
                <div class="feature-title">🎴 Smart Flashcards</div>
                <div class="feature-desc">AI-generated educational flashcards with subject-based content creation</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge completed"><CheckCircle size={14}/> IMPLEMENTED</div>
                <div class="feature-title">👤 User Profile & Analytics</div>
                <div class="feature-desc">Comprehensive user statistics, achievement system, and progress tracking</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge completed"><CheckCircle size={14}/> IMPLEMENTED</div>
                <div class="feature-title">🎨 Responsive Navigation</div>
                <div class="feature-desc">Modern navbar with smooth animations, mobile-first design, and theme switching</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge completed"><CheckCircle size={14}/> IMPLEMENTED</div>
                <div class="feature-title">🔐 Authentication System</div>
                <div class="feature-desc">Secure Supabase authentication with user profiles and session management</div>
              </div>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection-title">Technical Architecture</div>
            <div class="architecture-diagram">
              <div class="diagram-title">System Architecture Diagram</div>
              <div style="color: #6b7280; margin-bottom: 20px;">
                Frontend (React/TypeScript) ↔ Backend (Node.js/Express) ↔ Supabase ↔ AI Services
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
                <div style="padding: 15px; background: #eff6ff; border-radius: 8px;">
                  <strong>React Frontend</strong><br/>
                  TypeScript, Tailwind, Framer Motion
                </div>
                <div style="padding: 15px; background: #f0f9ff; border-radius: 8px;">
                  <strong>Node.js Backend</strong><br/>
                  Express, REST APIs, CORS
                </div>
                <div style="padding: 15px; background: #fef7ff; border-radius: 8px;">
                  <strong>Supabase</strong><br/>
                  PostgreSQL, Auth, Real-time
                </div>
                <div style="padding: 15px; background: #f0fdf4; border-radius: 8px;">
                  <strong>AI Services</strong><br/>
                  Gemini 2.0 Flash, Google AI
                </div>
              </div>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection-title">Technology Stack</div>
            <div class="tech-stack">
              <div class="tech-item">React 18</div>
              <div class="tech-item">TypeScript</div>
              <div class="tech-item">Tailwind CSS</div>
              <div class="tech-item">Framer Motion</div>
              <div class="tech-item">Node.js</div>
              <div class="tech-item">Express.js</div>
              <div class="tech-item">Supabase</div>
              <div class="tech-item">PostgreSQL</div>
              <div class="tech-item">Google Gemini AI</div>
              <div class="tech-item">Axios</div>
              <div class="tech-item">Lucide Icons</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🔄 Short-Term Roadmap (Next 4-6 Weeks)</div>
          
          <div class="subsection">
            <div class="subsection-title">Phase 1: Enhanced Core Features</div>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="status-badge planned"><Clock size={14}/> PLANNED</div>
                <div class="feature-title">⏱️ Study Session Timer</div>
                <div class="feature-desc">Pomodoro timer with session tracking, break management, and productivity analytics</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge planned"><Clock size={14}/> PLANNED</div>
                <div class="feature-title">🔄 Spaced Repetition</div>
                <div class="feature-desc">AI-powered flashcard review scheduling based on memory retention algorithms</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge planned"><Clock size={14}/> PLANNED</div>
                <div class="feature-title">📊 Advanced Analytics</div>
                <div class="feature-desc">Detailed study analytics with charts, progress tracking, and performance insights</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge planned"><Clock size={14}/> PLANNED</div>
                <div class="feature-title">👥 Study Groups</div>
                <div class="feature-desc">Collaborative learning with group creation, shared materials, and group chat</div>
              </div>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection-title">Phase 2: Mobile & Offline</div>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="status-badge planned"><Clock size={14}/> PLANNED</div>
                <div class="feature-title">📱 PWA Implementation</div>
                <div class="feature-desc">Progressive Web App for mobile devices with offline functionality</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge planned"><Clock size={14}/> PLANNED</div>
                <div class="feature-title">🔔 Push Notifications</div>
                <div class="feature-desc">Study reminders, goal tracking, and motivational notifications</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🎯 Mid-Term Vision (3-6 Months)</div>
          
          <div class="subsection">
            <div class="subsection-title">Advanced AI Features</div>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="status-badge future"><Zap size={14}/> FUTURE</div>
                <div class="feature-title">🎤 Voice Interaction</div>
                <div class="feature-desc">Voice commands and responses for hands-free studying</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge future"><Zap size={14}/> FUTURE</div>
                <div class="feature-title">📄 Document Analysis</div>
                <div class="feature-desc">PDF/PPT upload and AI-powered content summarization</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge future"><Zap size={14}/> FUTURE</div>
                <div class="feature-title">🧠 Adaptive Learning</div>
                <div class="feature-desc">AI that adapts to individual learning styles and knowledge gaps</div>
              </div>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection-title">Gamification & Social</div>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="status-badge future"><Users size={14}/> FUTURE</div>
                <div class="feature-title">🏆 Achievement System</div>
                <div class="feature-desc">XP, levels, badges, and leaderboards for motivation</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge future"><Users size={14}/> FUTURE</div>
                <div class="feature-title">🌐 Community Features</div>
                <div class="feature-desc">Discussion forums, peer Q&A, and knowledge sharing</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📈 Long-Term Strategy (6-12 Months)</div>
          
          <div class="subsection">
            <div class="subsection-title">Platform Expansion</div>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="status-badge future"><BarChart3 size={14}/> FUTURE</div>
                <div class="feature-title">🏫 Institution Edition</div>
                <div class="feature-desc">Classroom management, teacher dashboards, and LMS integration</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge future"><BarChart3 size={14}/> FUTURE</div>
                <div class="feature-title">🔌 API Ecosystem</div>
                <div class="feature-desc">Public APIs for third-party integrations and extensions</div>
              </div>
              
              <div class="feature-card">
                <div class="status-badge future"><BarChart3 size={14}/> FUTURE</div>
                <div class="feature-title">🌍 Multi-language</div>
                <div class="feature-desc">Internationalization and localization for global reach</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🛠️ Development Timeline</div>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-date">Phase 1</div>
              <div>
                <strong>Core Platform (Completed)</strong><br/>
                Authentication, AI Chat, Study Plans, Flashcards, Basic UI
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-date">Phase 2</div>
              <div>
                <strong>Enhanced Features (4-6 weeks)</strong><br/>
                Study Timer, Spaced Repetition, Analytics, Mobile PWA
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-date">Phase 3</div>
              <div>
                <strong>Advanced AI (3-6 months)</strong><br/>
                Voice Features, Document Analysis, Adaptive Learning
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-date">Phase 4</div>
              <div>
                <strong>Platform Growth (6-12 months)</strong><br/>
                Institution Features, API Ecosystem, Global Expansion
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📊 Success Metrics</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0;">
            <div style="padding: 20px; background: #f0f9ff; border-radius: 8px;">
              <strong>User Engagement</strong><br/>
              Daily active users, session duration, feature usage
            </div>
            <div style="padding: 20px; background: #f0fdf4; border-radius: 8px;">
              <strong>Learning Outcomes</strong><br/>
              Study consistency, knowledge retention, goal achievement
            </div>
            <div style="padding: 20px; background: #fef7ff; border-radius: 8px;">
              <strong>Technical Performance</strong><br/>
              Response times, uptime, mobile compatibility
            </div>
            <div style="padding: 20px; background: #fffbeb; border-radius: 8px;">
              <strong>Business Growth</strong><br/>
              User acquisition, retention rates, premium conversion
            </div>
          </div>
        </div>

        <div class="section no-print" style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
          <p style="color: #6b7280;">This document was automatically generated from the StudyBuddy application</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            StudyBuddy Project Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive overview of implemented features and future roadmap
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={generatePDF}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Download size={20} />
          <span>Download PDF</span>
        </motion.button>
      </div>

      <div id="documentation-content" className="space-y-8">
        {/* Executive Summary */}
        <section className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-500" />
            Executive Summary
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            StudyBuddy is a comprehensive AI-powered learning platform designed to revolutionize how students study and learn. 
            The platform combines artificial intelligence with modern web technologies to provide personalized learning experiences, 
            intelligent study planning, and interactive educational tools.
          </p>
        </section>

        {/* Current Implementation */}
        <section className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
            Current Implementation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-600 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle size={16} />
                <span className="font-semibold">IMPLEMENTED</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Study Buddy Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Real-time AI tutoring with streaming responses</p>
            </div>

            <div className="bg-white dark:bg-gray-600 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle size={16} />
                <span className="font-semibold">IMPLEMENTED</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Study Plan Generator</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">AI-powered personalized study schedules</p>
            </div>

            <div className="bg-white dark:bg-gray-600 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle size={16} />
                <span className="font-semibold">IMPLEMENTED</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Smart Flashcards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">AI-generated educational flashcards</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-600 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Node.js', 'Express.js', 'Supabase', 'PostgreSQL', 'Google Gemini AI'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap Sections */}
        <section className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-orange-500" />
            Development Roadmap
          </h2>

          <div className="space-y-6">
            {/* Short Term */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-500" />
                Short-Term (Next 4-6 Weeks)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Study Session Timer with Analytics',
                  'Spaced Repetition for Flashcards',
                  'Advanced Study Analytics Dashboard',
                  'Study Groups & Collaboration',
                  'Mobile PWA Implementation',
                  'Push Notifications System'
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mid Term */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-500" />
                Mid-Term (3-6 Months)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Voice Interaction & Commands',
                  'Document Analysis (PDF/PPT)',
                  'Adaptive Learning Algorithms',
                  'Advanced Gamification System',
                  'Community Discussion Forums',
                  'Multi-language Support'
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600 rounded-lg">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Long Term */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
                Long-Term (6-12 Months)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Institution & Classroom Edition',
                  'Public API Ecosystem',
                  'LMS Integration',
                  'Advanced Analytics Platform',
                  'Global Expansion',
                  'Premium Enterprise Features'
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-indigo-500" />
            Success Metrics & Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { metric: 'User Engagement', desc: 'Daily active users & session duration' },
              { metric: 'Learning Outcomes', desc: 'Study consistency & knowledge retention' },
              { metric: 'Technical Performance', desc: 'Response times & mobile compatibility' },
              { metric: 'Business Growth', desc: 'User acquisition & retention rates' }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-600 p-4 rounded-lg text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.metric}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default ProjectDocumentation;