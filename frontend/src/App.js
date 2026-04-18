import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [urls, setUrls] = useState('');
  const [files, setFiles] = useState([]);
  const [numK, setNumK] = useState(3);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [responseTime, setResponseTime] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMenu, setActiveMenu] = useState('chat');
  const [showSources, setShowSources] = useState(false);
  const [currentSources, setCurrentSources] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
  const [loadingStage, setLoadingStage] = useState('analyzing');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [tutorAnimation, setTutorAnimation] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const loadingIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const animationIntervalRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsRecording(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const startTutorAnimation = (duration) => {
    const animationSteps = [
      { emoji: '🤔', text: 'Thinking...', position: 'head' },
      { emoji: '📖', text: 'Reading...', position: 'book' },
      { emoji: '🔍', text: 'Analyzing...', position: 'magnifying' },
      { emoji: '💡', text: 'Understanding...', position: 'lightbulb' },
      { emoji: '✍️', text: 'Preparing answer...', position: 'pen' },
      { emoji: '🎯', text: 'Almost there...', position: 'target' },
      { emoji: '✨', text: 'Explaining...', position: 'stars' }
    ];
    
    let stepIndex = 0;
    const stepDuration = duration / animationSteps.length;
    
    animationIntervalRef.current = setInterval(() => {
      if (stepIndex < animationSteps.length) {
        setTutorAnimation(animationSteps[stepIndex]);
        stepIndex++;
      } else {
        clearInterval(animationIntervalRef.current);
        setTimeout(() => setTutorAnimation(null), 500);
      }
    }, stepDuration);
  };

  const stopTutorAnimation = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setTutorAnimation(null);
  };

  const startLoadingAnimation = () => {
    setLoadingProgress(0);
    const stages = ['analyzing', 'searching', 'retrieving', 'generating'];
    let currentStage = 0;
    
    loadingIntervalRef.current = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(loadingIntervalRef.current);
          return 100;
        }
        return prev + 2;
      });
      
      if (loadingProgress > 25 && currentStage === 0) {
        setLoadingStage(stages[1]);
        currentStage = 1;
      } else if (loadingProgress > 50 && currentStage === 1) {
        setLoadingStage(stages[2]);
        currentStage = 2;
      } else if (loadingProgress > 75 && currentStage === 2) {
        setLoadingStage(stages[3]);
        currentStage = 3;
      }
    }, 50);
  };

  const stopLoadingAnimation = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
    setLoadingProgress(100);
    setTimeout(() => {
      setLoadingStage('analyzing');
      setLoadingProgress(0);
    }, 500);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
      } else {
        recognitionRef.current.start();
        setIsRecording(true);
      }
    }
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    for (const file of validFiles) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      };
      
      reader.onloadend = () => {
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 500);
      };
      
      reader.readAsDataURL(file);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const playAudio = (audioBase64, messageId, text) => {
    if (playingAudio === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setPlayingAudio(null);
        setCurrentTime(0);
        setAudioDuration(0);
        stopTutorAnimation();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        stopTutorAnimation();
      }
      
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        setAudioDuration(duration);
        startTutorAnimation(duration * 1000);
      });
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      
      audio.play();
      setPlayingAudio(messageId);
      
      audio.onended = () => {
        setPlayingAudio(null);
        setCurrentTime(0);
        setAudioDuration(0);
        stopTutorAnimation();
      };
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const startTime = Date.now();
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    startLoadingAnimation();

    const formData = new FormData();
    formData.append('query_gen', inputMessage);
    
    if (urls.trim()) formData.append('urls', urls);
    if (numK) formData.append('num_k', numK);
    if (chunkSize) formData.append('chunk_size', chunkSize);
    if (chunkOverlap) formData.append('chunk_overlap', chunkOverlap);
    
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('http://localhost:8000/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const responseTimeMs = Date.now() - startTime;
      setResponseTime(responseTimeMs);

      if (data.status === 'ok') {
        stopLoadingAnimation();
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            text: data.response,
            sender: 'bot',
            timestamp: new Date(),
            sources: data.matched_chunks,
            distances: data.distances,
            audioBase64: data.audio_base64,
          };
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
        }, 300);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      stopLoadingAnimation();
      const errorMessage = {
        id: Date.now() + 1,
        text: error.message,
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
      setTimeout(() => setResponseTime(null), 3000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudio(null);
      setCurrentTime(0);
      setAudioDuration(0);
      stopTutorAnimation();
    }
  };

  const exportChat = () => {
    const chatHistory = messages.map(msg => ({
      role: msg.sender,
      content: msg.text,
      timestamp: msg.timestamp,
      reactions: messageReactions[msg.id]
    }));
    const dataStr = JSON.stringify(chatHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `chat-export-${Date.now()}.json`);
    linkElement.click();
  };

  const addReaction = (messageId, emoji) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: prev[messageId] === emoji ? null : emoji
    }));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const dateKey = formatDate(msg.timestamp);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const getLoadingMessage = () => {
    switch(loadingStage) {
      case 'analyzing':
        return 'Analyzing your question...';
      case 'searching':
        return 'Searching through documents...';
      case 'retrieving':
        return 'Retrieving relevant information...';
      case 'generating':
        return 'Generating response...';
      default:
        return 'Processing...';
    }
  };

  const suggestedQuestions = [
    { text: "📊 Summarize key points", icon: "📊" },
    { text: "🔍 What are the main conclusions?", icon: "🔍" },
    { text: "📝 List important details", icon: "📝" },
    { text: "💡 Explain in simple terms", icon: "💡" },
    { text: "🎯 What are the recommendations?", icon: "🎯" }
  ];

  // Tutor animation styles
  const tutorAnimationStyle = {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    zIndex: 1000,
    animation: 'floatTutor 2s ease-in-out infinite'
  };

  const tutorCardStyle = {
    background: darkMode ? '#1e293b' : '#ffffff',
    borderRadius: '20px',
    padding: '16px 24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: `2px solid ${darkMode ? '#6366f1' : '#8b5cf6'}`,
    animation: 'pulseGlow 1s ease-in-out infinite'
  };

  const tutorEmojiStyle = {
    fontSize: '48px',
    animation: 'bounceEmoji 0.5s ease-in-out infinite'
  };

  const tutorTextStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: darkMode ? '#ffffff' : '#1f2937'
  };

  const progressBarStyle = {
    marginTop: '8px',
    width: '100%',
    height: '4px',
    background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden'
  };

  const progressFillStyle = {
    width: `${(currentTime / audioDuration) * 100}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    transition: 'width 0.1s linear'
  };

  // Loading animation styles
  const loadingContainerStyle = {
    animation: 'slideInUp 0.3s ease-out',
    margin: '16px 0'
  };

  const loadingMessageStyle = {
    display: 'flex',
    gap: '12px',
    maxWidth: '80%'
  };

  const loadingAvatarStyle = {
    width: '40px',
    height: '40px',
    flexShrink: 0
  };

  const pulseAnimationStyle = {
    animation: 'pulseRing 1.5s ease-in-out infinite'
  };

  const loadingContentStyle = {
    flex: 1,
    background: darkMode ? '#1e293b' : '#ffffff',
    borderRadius: '20px',
    padding: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    animation: 'glowPulse 2s ease-in-out infinite'
  };

  const loadingHeaderStyle = {
    marginBottom: '12px'
  };

  const loadingTitleStyle = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#6366f1',
    marginBottom: '4px'
  };

  const loadingStageStyle = {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500
  };

  const loadingBarContainerStyle = {
    height: '3px',
    background: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    margin: '12px 0'
  };

  const loadingBarStyle = {
    height: '100%',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '3px',
    width: `${loadingProgress}%`,
    transition: 'width 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  };

  const loadingBarShimmerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: 'shimmer 1.5s infinite'
  };

  const loadingAnimationStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '12px 0'
  };

  const loadingDotsStyle = {
    display: 'flex',
    gap: '4px'
  };

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#6366f1',
    animation: 'bounce 1.4s infinite ease-in-out both'
  };

  const loadingTextStyle = {
    fontSize: '13px',
    color: '#6366f1',
    fontWeight: 500
  };

  const loadingTipsStyle = {
    marginTop: '12px',
    padding: '8px 12px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    animation: 'fadeInOut 2s ease-in-out infinite'
  };

  const tipIconStyle = {
    fontSize: '14px'
  };

  const tipTextStyle = {
    color: '#6b7280',
    flex: 1
  };

  const botAvatarStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <style>
        {`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulseRing {
            0% {
              box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
            }
          }
          
          @keyframes glowPulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.2);
            }
            50% {
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
            }
          }
          
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0.6);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes fadeInOut {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
          
          @keyframes floatTutor {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          @keyframes bounceEmoji {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.2);
            }
          }
          
          @keyframes pulseGlow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
            }
          }
          
          .voice-btn.recording {
            animation: recordingPulse 1s ease-in-out infinite;
          }
          
          @keyframes recordingPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 0 5px rgba(239, 68, 68, 0);
            }
          }
        `}
      </style>
      
      {/* Tutor Animation */}
      {tutorAnimation && (
        <div style={tutorAnimationStyle}>
          <div style={tutorCardStyle}>
            <div style={tutorEmojiStyle}>{tutorAnimation.emoji}</div>
            <div>
              <div style={tutorTextStyle}>{tutorAnimation.text}</div>
              {audioDuration > 0 && (
                <>
                  <div style={progressBarStyle}>
                    <div style={progressFillStyle}></div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    {formatDuration(currentTime)} / {formatDuration(audioDuration)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </div>
            <div className="logo-text">
              <h1>RAG</h1>
              <span>Intelligent Assistant</span>
            </div>
          </div>
          <button className="menu-toggle" onClick={() => setIsSidebarOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-menu">
          <button className={`menu-item ${activeMenu === 'chat' ? 'active' : ''}`} onClick={() => setActiveMenu('chat')}>
            <span className="menu-icon">💬</span>
            <span className="menu-label">Chat</span>
          </button>
          <button className={`menu-item ${activeMenu === 'docs' ? 'active' : ''}`} onClick={() => setActiveMenu('docs')}>
            <span className="menu-icon">📄</span>
            <span className="menu-label">Documents</span>
            {files.length > 0 && <span className="menu-badge">{files.length}</span>}
          </button>
          <button className={`menu-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => setActiveMenu('settings')}>
            <span className="menu-icon">⚙️</span>
            <span className="menu-label">Settings</span>
          </button>
        </div>

        <div className="sidebar-content">
          {activeMenu === 'docs' && (
            <div className="docs-section">
              <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v12m0 0l-3-3m3 3l3-3M5 21h14" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <p>Upload PDF Documents</p>
                <span>Drag & drop or click to browse</span>
              </div>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              {files.length > 0 && (
                <div className="file-list">
                  <h4>Uploaded Files</h4>
                  {files.map((file, index) => (
                    <div key={index} className="file-card">
                      <div className="file-card-info">
                        <span className="file-icon">📄</span>
                        <div className="file-details">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      {uploadProgress[file.name] && (
                        <div className="file-progress">
                          <div className="progress-bar" style={{ width: `${uploadProgress[file.name]}%` }}></div>
                        </div>
                      )}
                      <button className="remove-file" onClick={() => removeFile(index)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMenu === 'settings' && (
            <div className="settings-section">
              <div className="setting-group">
                <label>🌐 URL Sources</label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://example.com"
                  rows="2"
                />
              </div>
              <div className="setting-group">
                <label>🎯 Retrieval Settings</label>
                <div className="slider-control">
                  <div className="slider-header">
                    <span>Number of chunks (k)</span>
                    <span className="slider-value">{numK}</span>
                  </div>
                  <input
                    type="range"
                    value={numK}
                    onChange={(e) => setNumK(parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="slider"
                  />
                </div>
                <div className="slider-control">
                  <div className="slider-header">
                    <span>Chunk Size</span>
                    <span className="slider-value">{chunkSize}</span>
                  </div>
                  <input
                    type="range"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    min="100"
                    max="5000"
                    step="100"
                    className="slider"
                  />
                </div>
                <div className="slider-control">
                  <div className="slider-header">
                    <span>Chunk Overlap</span>
                    <span className="slider-value">{chunkOverlap}</span>
                  </div>
                  <input
                    type="range"
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                    min="0"
                    max="1000"
                    step="50"
                    className="slider"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="footer-btn" onClick={clearChat}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Clear
          </button>
          <button className="footer-btn" onClick={exportChat}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5m-5 5V4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Export
          </button>
          <button className="footer-btn" onClick={() => setDarkMode(!darkMode)}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              {darkMode ? (
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" stroke="currentColor" strokeWidth="2"/>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2"/>
              )}
            </svg>
          </button>
        </div>
      </div>

      {!isSidebarOpen && (
        <button className="open-sidebar" onClick={() => setIsSidebarOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      )}

      <div className={`chat-main ${!isSidebarOpen ? 'expanded' : ''}`}>
        <div className="chat-header">
          <div className="header-info">
            <h2>RAG Assistant</h2>
            {responseTime && (
              <div className="response-badge">
                <div className="pulse-dot"></div>
                {responseTime}ms
              </div>
            )}
          </div>
          <div className="header-status">
            {files.length > 0 && (
              <div className="doc-badge">
                <span>📄</span>
                {files.length} document{files.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3>Hello! I'm your RAG Assistant</h3>
              <p>Upload documents or provide URLs to get started</p>
              <div className="features">
                <div className="feature">
                  <span>📄</span>
                  <span>PDF Analysis</span>
                </div>
                <div className="feature">
                  <span>🌐</span>
                  <span>Web Content</span>
                </div>
                <div className="feature">
                  <span>🎯</span>
                  <span>Smart Search</span>
                </div>
                <div className="feature">
                  <span>⚡</span>
                  <span>Fast Retrieval</span>
                </div>
              </div>
              <div className="suggestions-grid">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="suggestion-btn"
                    onClick={() => setInputMessage(q.text)}
                  >
                    <span className="suggestion-icon">{q.icon}</span>
                    <span className="suggestion-text">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {Object.entries(groupMessagesByDate()).map(([date, dateMessages]) => (
                <React.Fragment key={date}>
                  <div className="date-divider">
                    <span>{date}</span>
                  </div>
                  {dateMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`message-row ${message.sender} ${message.isError ? 'error' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="message-avatar">
                        {message.sender === 'user' ? (
                          <div className="user-avatar">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="bot-avatar">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="message-bubble">
                        <div className="message-text">{message.text}</div>
                        <div className="message-footer">
                          <span className="message-time">{formatTime(message.timestamp)}</span>
                          <div className="message-actions">
                            {/* Audio Button - Visible for all bot messages with audio */}
                            {message.sender === 'bot' && message.audioBase64 && (
                              <button
                                className="action-icon audio-btn"
                                onClick={() => playAudio(message.audioBase64, message.id, message.text)}
                                style={{
                                  background: playingAudio === message.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                  animation: playingAudio === message.id ? 'pulseRing 1s ease-in-out infinite' : 'none'
                                }}
                                title={playingAudio === message.id ? "Stop audio explanation" : "Listen to audio explanation"}
                              >
                                {playingAudio === message.id ? '⏸️' : '🔊'}
                                <span style={{ marginLeft: '4px', fontSize: '11px' }}>
                                  {playingAudio === message.id ? 'Playing...' : 'Listen'}
                                </span>
                              </button>
                            )}
                            {message.sender === 'bot' && message.sources && (
                              <button
                                className="action-icon"
                                onClick={() => {
                                  setCurrentSources(message.sources);
                                  setShowSources(!showSources);
                                }}
                                title="View sources"
                              >
                                📚
                              </button>
                            )}
                            <button
                              className="action-icon"
                              onClick={() => addReaction(message.id, '👍')}
                              title="Like"
                            >
                              👍
                            </button>
                            <button
                              className="action-icon"
                              onClick={() => navigator.clipboard.writeText(message.text)}
                              title="Copy"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                        {/* Audio Progress Bar for this specific message */}
                        {message.sender === 'bot' && playingAudio === message.id && audioDuration > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <div style={progressBarStyle}>
                              <div style={progressFillStyle}></div>
                            </div>
                            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', textAlign: 'right' }}>
                              {formatDuration(currentTime)} / {formatDuration(audioDuration)}
                            </div>
                          </div>
                        )}
                        {messageReactions[message.id] && (
                          <div className="message-reaction">
                            {messageReactions[message.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
              
              {/* Loading Animation */}
              {isTyping && (
                <div style={loadingContainerStyle}>
                  <div style={loadingMessageStyle}>
                    <div style={loadingAvatarStyle}>
                      <div style={{...botAvatarStyle, ...pulseAnimationStyle}}>
                        <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6366f1" strokeWidth="1.5"/>
                        </svg>
                      </div>
                    </div>
                    <div style={loadingContentStyle}>
                      <div style={loadingHeaderStyle}>
                        <div style={loadingTitleStyle}>AI Assistant</div>
                        <div style={loadingStageStyle}>{getLoadingMessage()}</div>
                      </div>
                      <div style={loadingBarContainerStyle}>
                        <div style={loadingBarStyle}>
                          <div style={loadingBarShimmerStyle}></div>
                        </div>
                      </div>
                      <div style={loadingAnimationStyle}>
                        <div style={loadingDotsStyle}>
                          <span style={{...dotStyle, animationDelay: '-0.32s'}}></span>
                          <span style={{...dotStyle, animationDelay: '-0.16s'}}></span>
                          <span style={{...dotStyle, animationDelay: '0s'}}></span>
                          <span style={{...dotStyle, animationDelay: '0.16s'}}></span>
                        </div>
                        <div style={loadingTextStyle}>{getLoadingMessage()}</div>
                      </div>
                      <div style={loadingTipsStyle}>
                        <span style={tipIconStyle}>💡</span>
                        <span style={tipTextStyle}>
                          {loadingStage === 'analyzing' && "Analyzing the context of your question..."}
                          {loadingStage === 'searching' && "Searching through your documents..."}
                          {loadingStage === 'retrieving' && "Retrieving the most relevant information..."}
                          {loadingStage === 'generating' && "Crafting a comprehensive response..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {showSources && currentSources.length > 0 && (
          <div className="sources-panel">
            <div className="sources-header">
              <h4>
                <span>📚</span>
                Retrieved Sources
              </h4>
              <button className="close-sources" onClick={() => setShowSources(false)}>×</button>
            </div>
            <div className="sources-list">
              {currentSources.map((source, idx) => (
                <div key={idx} className="source-item">
                  <div className="source-title">Source {idx + 1}</div>
                  <p>{source.substring(0, 200)}...</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="input-section">
          <div className="input-container">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              rows="1"
              disabled={isLoading}
            />
            <div className="input-buttons">
              <button
                className={`voice-btn ${isRecording ? 'recording' : ''}`}
                onClick={handleVoiceInput}
                disabled={isLoading}
                title="Voice input"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="send-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="input-hint">
            <span>↵ Enter to send • ⇧ Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;